import { Router, Request, Response } from "express";

const router = Router();

// In-memory user store for dev/testing when MongoDB is offline
export interface DevUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  aiCreditsRemaining: number;
  createdAt: Date;
}

export const devUsers: DevUser[] = [
  {
    id: "usr_admin_default",
    name: "Mahfuz Admin",
    email: "admin@nexora.agency",
    passwordHash: "Admin123!",
    role: "admin",
    aiCreditsRemaining: 100,
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
router.post("/sign-up/email", (req: Request, res: Response): void => {
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

  const existing = devUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    res.status(400).json({
      status: false,
      message: "An account with this email address already exists.",
    });
    return;
  }

  const newUser: DevUser = {
    id: `usr_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: password,
    role: "user",
    aiCreditsRemaining: 5,
    createdAt: new Date(),
  };

  devUsers.push(newUser);
  const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  activeSession = { user: newUser, token };

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
router.post("/sign-in/email", (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: false,
      message: "Email and password are required.",
    });
    return;
  }

  const user = devUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.passwordHash !== password) {
    res.status(401).json({
      status: false,
      message: "Invalid email or password.",
    });
    return;
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  activeSession = { user, token };

  res.cookie("better-auth.session_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({
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

export default router;
