import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Otp from "../models/Otp.js";
import { sendOtpVerificationEmail } from "../services/email.service.js";
import { getMongoClient } from "../config/db.js";
import { hashPassword } from "better-auth/crypto";
import { devUsers } from "./auth-fallback.routes.js";

const router = Router();
const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";

// In-memory fallback in case of temporary DB disconnect
const inMemoryOtps: Array<{
  email: string;
  otp: string;
  type: string;
  expiresAt: Date;
  createdAt: Date;
}> = [];

function cleanOldMemoryOtps() {
  const now = new Date();
  for (let i = inMemoryOtps.length - 1; i >= 0; i--) {
    if (inMemoryOtps[i].expiresAt < now) {
      inMemoryOtps.splice(i, 1);
    }
  }
}

/**
 * POST /api/auth/send-otp
 * Generates and dispatches a 6-digit verification code to the user's Gmail
 */
router.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, type = "registration" } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ success: false, message: "Email address is required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }

    // 1. Check if user already exists (for registration)
    if (type === "registration") {
      try {
        const client = getMongoClient();
        const db = client.db(DB_NAME);
        // Better Auth typically uses "user" or "users"
        const existingUser =
          (await db.collection("user").findOne({ email: cleanEmail })) ||
          (await db.collection("users").findOne({ email: cleanEmail }));

        if (existingUser) {
          res.status(400).json({
            success: false,
            message: "An account with this email address already exists. Please sign in instead.",
          });
          return;
        }
      } catch (err) {
        console.warn("User existence check warning (proceeding):", err);
      }
    }

    // 2. Rate-limit check (prevent flooding within 45 seconds)
    const now = new Date();
    const fortyFiveSecsAgo = new Date(now.getTime() - 45 * 1000);

    if (mongoose.connection.readyState === 1) {
      const recentOtp = await Otp.findOne({
        email: cleanEmail,
        createdAt: { $gt: fortyFiveSecsAgo },
      });

      if (recentOtp) {
        res.status(429).json({
          success: false,
          message: "A verification code was recently sent. Please check your Gmail inbox or wait 45 seconds to resend.",
        });
        return;
      }
    }

    // 3. Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    // 4. Save to Database (remove any previous unverified OTP for this email)
    if (mongoose.connection.readyState === 1) {
      await Otp.deleteMany({ email: cleanEmail });
      await Otp.create({
        email: cleanEmail,
        otp: otpCode,
        type,
        expiresAt,
      });
    }

    // Always maintain memory fallback
    cleanOldMemoryOtps();
    const memIdx = inMemoryOtps.findIndex((o) => o.email === cleanEmail);
    if (memIdx !== -1) inMemoryOtps.splice(memIdx, 1);
    inMemoryOtps.push({
      email: cleanEmail,
      otp: otpCode,
      type,
      expiresAt,
      createdAt: now,
    });

    // 5. Dispatch real email via Nodemailer
    const emailResult = await sendOtpVerificationEmail({
      email: cleanEmail,
      name: name && typeof name === "string" ? name.trim() : undefined,
      otp: otpCode,
      expiresInMinutes: 10,
    });

    console.log(`🔐 [OTP DISPATCHED] To: ${cleanEmail} | Code: ${otpCode} | Dispatched: ${emailResult.success}`);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit code entered by the user
 */
router.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP code are required." });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const now = new Date();

    let isValid = false;

    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      const match = await Otp.findOne({
        email: cleanEmail,
        otp: cleanOtp,
        expiresAt: { $gt: now },
      });

      if (match) {
        isValid = true;
        // Clean up verified OTP
        await Otp.deleteOne({ _id: match._id });
        const memIdx = inMemoryOtps.findIndex((o) => o.email === cleanEmail);
        if (memIdx !== -1) inMemoryOtps.splice(memIdx, 1);
      }
    }

    // Check memory fallback
    if (!isValid) {
      cleanOldMemoryOtps();
      const memMatchIdx = inMemoryOtps.findIndex(
        (o) => o.email === cleanEmail && o.otp === cleanOtp && o.expiresAt > now
      );

      if (memMatchIdx !== -1) {
        isValid = true;
        inMemoryOtps.splice(memMatchIdx, 1);
      }
    }

    if (!isValid) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please check your code or request a new one.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Email address verified successfully!",
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed due to a server error. Please try again.",
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Checks if account exists, generates 6-digit OTP, and emails it to the user.
 */
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, message: "Please provide a valid email address format." });
      return;
    }

    // 1. Verify that user account exists
    let existingUser: any = null;
    try {
      const client = getMongoClient();
      const db = client.db(DB_NAME);
      existingUser =
        (await db.collection("user").findOne({ email: cleanEmail })) ||
        (await db.collection("users").findOne({ email: cleanEmail }));
    } catch (dbErr) {
      console.warn("Database lookup warning on forgot-password:", dbErr);
    }

    if (!existingUser) {
      existingUser = devUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    }

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "No account found associated with this email address. Please register first.",
      });
      return;
    }

    // 2. Rate limit (45s window)
    const now = new Date();
    const fortyFiveSecsAgo = new Date(now.getTime() - 45 * 1000);

    if (mongoose.connection.readyState === 1) {
      const recentOtp = await Otp.findOne({
        email: cleanEmail,
        createdAt: { $gt: fortyFiveSecsAgo },
      });

      if (recentOtp) {
        res.status(429).json({
          success: false,
          message: "A verification code was recently sent. Please check your inbox or wait 45 seconds to request again.",
        });
        return;
      }
    }

    // 3. Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    // 4. Save to Database
    if (mongoose.connection.readyState === 1) {
      await Otp.deleteMany({ email: cleanEmail });
      await Otp.create({
        email: cleanEmail,
        otp: otpCode,
        type: "password_reset",
        expiresAt,
      });
    }

    // Maintain memory fallback
    cleanOldMemoryOtps();
    const memIdx = inMemoryOtps.findIndex((o) => o.email === cleanEmail);
    if (memIdx !== -1) inMemoryOtps.splice(memIdx, 1);
    inMemoryOtps.push({
      email: cleanEmail,
      otp: otpCode,
      type: "password_reset",
      expiresAt,
      createdAt: now,
    });

    // 5. Dispatch email
    const emailResult = await sendOtpVerificationEmail({
      email: cleanEmail,
      name: existingUser.name,
      otp: otpCode,
      expiresInMinutes: 10,
    });

    console.log(`🔐 [PASSWORD RESET CODE DISPATCHED] To: ${cleanEmail} | Code: ${otpCode} | Dispatched: ${emailResult.success}`);

    res.status(200).json({
      success: true,
      message: `A 6-digit password reset code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (error: any) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to dispatch password reset code. Please try again.",
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Validates the 6-digit OTP and updates the user's password securely
 */
router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Email, OTP verification code, and new password are required.",
      });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
      return;
    }

    const now = new Date();
    let isValid = false;

    // 1. Verify OTP in MongoDB
    if (mongoose.connection.readyState === 1) {
      const match = await Otp.findOne({
        email: cleanEmail,
        otp: cleanOtp,
        expiresAt: { $gt: now },
      });

      if (match) {
        isValid = true;
        await Otp.deleteOne({ _id: match._id });
        const memIdx = inMemoryOtps.findIndex((o) => o.email === cleanEmail);
        if (memIdx !== -1) inMemoryOtps.splice(memIdx, 1);
      }
    }

    // Verify memory fallback
    if (!isValid) {
      cleanOldMemoryOtps();
      const memMatchIdx = inMemoryOtps.findIndex(
        (o) => o.email === cleanEmail && o.otp === cleanOtp && o.expiresAt > now
      );

      if (memMatchIdx !== -1) {
        isValid = true;
        inMemoryOtps.splice(memMatchIdx, 1);
      }
    }

    if (!isValid) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please check your code or request a new one.",
      });
      return;
    }

    // 2. Hash new password
    let newHash = newPassword;
    try {
      newHash = await hashPassword(newPassword);
    } catch (hErr) {
      console.warn("Could not hash password with crypto:", hErr);
    }

    // 3. Update in MongoDB
    let userFound = false;
    try {
      const client = getMongoClient();
      const db = client.db(DB_NAME);

      const dbUser =
        (await db.collection("user").findOne({ email: cleanEmail })) ||
        (await db.collection("users").findOne({ email: cleanEmail }));

      if (dbUser) {
        userFound = true;
        const userId = dbUser.id || dbUser._id?.toString();

        await db.collection("account").updateOne(
          {
            $or: [
              { userId: userId, providerId: "credential" },
              { accountId: cleanEmail, providerId: "credential" },
            ],
          },
          {
            $set: {
              userId: userId,
              accountId: cleanEmail,
              providerId: "credential",
              password: newHash,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              _id: `acc_${Date.now()}` as any,
              id: `acc_${Date.now()}`,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    } catch (dbErr) {
      console.warn("Database error updating password:", dbErr);
    }

    // 4. Update dev users if present
    const devUser = devUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (devUser) {
      devUser.passwordHash = newPassword;
      userFound = true;
    }

    if (!userFound) {
      res.status(404).json({
        success: false,
        message: "Account record could not be located to update password.",
      });
      return;
    }

    console.log(`🔑 [PASSWORD RESET SUCCESSFUL] Account: ${cleanEmail}`);

    res.status(200).json({
      success: true,
      message: "Password has been successfully updated! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Error in reset-password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password due to a server error. Please try again.",
    });
  }
});

export default router;
