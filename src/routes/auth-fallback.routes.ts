import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { getMongoClient } from "../config/db.js";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { createNotification } from "../services/notification.service.js";

const router = Router();
const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";

function getDatabase() {
  if (mongoose.connection?.readyState === 1 && mongoose.connection?.db) {
    return mongoose.connection.db;
  }
  try {
    const client = getMongoClient();
    return client.db(DB_NAME);
  } catch {
    return null;
  }
}

// In-memory user store for dev/testing when MongoDB is offline
export interface DevUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  aiCreditsRemaining: number;
  image?: string | null;
  createdAt: Date;
}

export const devUsers: DevUser[] = [
  {
    id: "admin_super_mahfuz",
    name: "MD.MAHFUZUL HAQUE",
    email: "mdmahfuzulhaque3140@gmail.com",
    passwordHash: "Ms31403140@@",
    role: "superadmin",
    aiCreditsRemaining: 999,
    createdAt: new Date(),
  },
  {
    id: "usr_demo_client",
    name: "Alex Client",
    email: "alex@company.com",
    passwordHash: "Client123!",
    role: "user",
    aiCreditsRemaining: 5,
    createdAt: new Date(),
  },
];

let activeSession: { user: DevUser; token: string } | null = null;

/**
 * POST /api/auth/sign-up/email
 */
router.post("/sign-up/email", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({
      status: false,
      message: "Name must be at least 2 characters.",
    });
    return;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    res.status(400).json({
      status: false,
      message: "Please enter a valid email address.",
    });
    return;
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({
      status: false,
      message: "Password must be at least 6 characters long.",
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = getDatabase();

  // 1. Check if user already exists in MongoDB
  if (db) {
    try {
      const existingDbUser = await db.collection("user").findOne({ email: normalizedEmail });
      if (existingDbUser) {
        res.status(400).json({
          status: false,
          message: "An account with this email address already exists.",
        });
        return;
      }
    } catch (err) {
      console.warn("MongoDB check on signup:", err);
    }
  }

  const existingDev = devUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingDev) {
    res.status(400).json({
      status: false,
      message: "An account with this email address already exists.",
    });
    return;
  }

  const newUserId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let hashedPassword = password;
  try {
    hashedPassword = await hashPassword(password);
  } catch {
    // fallback
  }

  // 2. Persist to MongoDB collections (user, account, session)
  if (db) {
    try {
      await db.collection("user").insertOne({
        _id: newUserId as any,
        id: newUserId,
        name: name.trim(),
        email: normalizedEmail,
        emailVerified: false,
        image: null,
        role: "user",
        aiCreditsRemaining: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.collection("account").insertOne({
        _id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` as any,
        id: `acc_${Date.now()}`,
        userId: newUserId,
        accountId: normalizedEmail,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (dbErr) {
      console.error("Error saving user to MongoDB:", dbErr);
    }
  }

  const newUser: DevUser = {
    id: newUserId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: password,
    role: "user",
    aiCreditsRemaining: 5,
    createdAt: new Date(),
  };

  devUsers.push(newUser);
  createNotification({
    recipientRole: "admin",
    type: "user_register",
    title: "New Member Registered",
    message: `${newUser.name} (${newUser.email}) registered an account.`,
    link: "/admin/users",
  }).catch(() => {});

  const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  activeSession = { user: newUser, token };

  if (db) {
    try {
      await db.collection("session").insertOne({
        _id: `sess_${Date.now()}` as any,
        id: `sess_${Date.now()}`,
        userId: newUserId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch {
      // ignore
    }
  }

  res.cookie("better-auth.session_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      aiCreditsRemaining: newUser.aiCreditsRemaining,
      createdAt: newUser.createdAt,
    },
  });
});

/**
 * POST /api/auth/sign-in/email
 */
router.post("/sign-in/email", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: false,
      message: "Email and password are required.",
    });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const db = getDatabase();

  let authenticatedUser: DevUser | null = null;

  // 1. Try finding and verifying from MongoDB first
  if (db) {
    try {
      const dbUser = (await db.collection("user").findOne({ email: normalizedEmail })) as any;
      if (dbUser) {
        const userId = dbUser.id || dbUser._id?.toString();
        const account = await db.collection("account").findOne({
          $or: [
            { userId: userId, providerId: "credential" },
            { accountId: normalizedEmail, providerId: "credential" },
          ],
        });

        if (account && account.password) {
          let isValid = false;
          try {
            isValid = await verifyPassword({
              password: password,
              hash: account.password,
            });
          } catch {
            isValid = account.password === password;
          }

          if (isValid || account.password === password) {
            authenticatedUser = {
              id: userId,
              name: dbUser.name || "User",
              email: dbUser.email,
              passwordHash: account.password,
              role: dbUser.role || "user",
              aiCreditsRemaining: dbUser.aiCreditsRemaining ?? 5,
              image: dbUser.image || null,
              createdAt: dbUser.createdAt || new Date(),
            };
          }
        }
      }
    } catch (err) {
      console.warn("MongoDB sign-in lookup error:", err);
    }
  }

  // 2. Dev in-memory fallback
  if (!authenticatedUser) {
    const user = devUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (user && user.passwordHash === password) {
      authenticatedUser = user;
    }
  }

  if (!authenticatedUser) {
    res.status(401).json({
      status: false,
      message: "Invalid email or password.",
    });
    return;
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  activeSession = { user: authenticatedUser, token };

  if (db) {
    try {
      await db.collection("session").insertOne({
        _id: `sess_${Date.now()}` as any,
        id: `sess_${Date.now()}`,
        userId: authenticatedUser.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch {
      // ignore
    }
  }

  res.cookie("better-auth.session_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({
    token,
    user: {
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      aiCreditsRemaining: authenticatedUser.aiCreditsRemaining,
    },
  });
});

/**
 * POST /api/auth/sign-out
 */
router.post("/sign-out", (_req: Request, res: Response): void => {
  activeSession = null;
  res.clearCookie("better-auth.session_token");
  res.status(200).json({
    success: true,
    message: "Signed out successfully.",
  });
});

/**
 * GET /api/auth/get-session or /api/auth/session
 */
router.get(["/get-session", "/session"], (_req: Request, res: Response): void => {
  if (!activeSession) {
    res.status(200).json(null);
    return;
  }

  res.status(200).json({
    session: {
      id: "sess_" + activeSession.token,
      userId: activeSession.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    user: {
      id: activeSession.user.id,
      name: activeSession.user.name,
      email: activeSession.user.email,
      role: activeSession.user.role,
      aiCreditsRemaining: activeSession.user.aiCreditsRemaining,
    },
  });
});

/**
 * POST /api/auth/sign-in/social (Development fallback)
 */
router.post("/sign-in/social", async (req: Request, res: Response): Promise<void> => {
  const { provider = "google", callbackURL } = req.body;

  const targetProvider = (provider as string).toLowerCase();
  const userName =
    targetProvider === "github" ? "GitHub Developer" : "Google User";
  const userEmail =
    targetProvider === "github" ? "dev@github.nexora" : "user@gmail.nexora";

  const db = getDatabase();
  const userId = `usr_${targetProvider}_${Date.now()}`;

  if (db) {
    try {
      await db.collection("user").updateOne(
        { email: userEmail },
        {
          $setOnInsert: {
            _id: userId as any,
            id: userId,
            name: userName,
            email: userEmail,
            emailVerified: true,
            image: null,
            role: "user",
            aiCreditsRemaining: 5,
            createdAt: new Date(),
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );
    } catch (err) {
      console.warn("MongoDB social login error:", err);
    }
  }

  let user = devUsers.find((u) => u.email === userEmail);
  if (!user) {
    user = {
      id: userId,
      name: userName,
      email: userEmail,
      passwordHash: "oauth_simulated",
      role: "user",
      aiCreditsRemaining: 5,
      createdAt: new Date(),
    };
    devUsers.push(user);
  }

  const token = `tok_${targetProvider}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  activeSession = { user, token };

  if (db) {
    try {
      await db.collection("session").insertOne({
        _id: `sess_${Date.now()}` as any,
        id: `sess_${Date.now()}`,
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch {
      // ignore
    }
  }

  res.cookie("better-auth.session_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  const clientBase = process.env.CLIENT_URL || "http://localhost:3000";
  const redirectTarget = callbackURL || `${clientBase}/dashboard`;

  res.status(200).json({
    url: redirectTarget,
    redirect: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      aiCreditsRemaining: user.aiCreditsRemaining,
    },
  });
});

export default router;

