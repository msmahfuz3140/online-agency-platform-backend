import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getMongoClient } from "../config/db.js";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { devUsers } from "./auth-fallback.routes.js";
import { createNotification } from "../services/notification.service.js";

const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";
const router = Router();

/**
 * GET /api/user/me or /api/user/profile
 * Returns the currently logged-in user's profile (role, aiCreditsRemaining, active subscription plan, etc.)
 */
router.get(["/me", "/profile"], requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getMongoClient();
    const db = client.db(DB_NAME);
    const dbUser = await db.collection("user").findOne({
      $or: [{ id: req.user!.id }, { _id: req.user!.id as any }, { email: req.user!.email }],
    });

    res.json({
      success: true,
      user: {
        id: req.user!.id,
        name: dbUser?.name || req.user!.name,
        email: dbUser?.email || req.user!.email,
        image: dbUser?.image || null,
        phoneNumber: dbUser?.phoneNumber || "",
        company: dbUser?.company || "",
        role: dbUser?.role || req.user!.role || "user",
        aiCreditsRemaining: dbUser?.aiCreditsRemaining ?? req.user!.aiCreditsRemaining ?? 5,
        plan: dbUser?.plan || (req.user!.role === "superadmin" ? "business" : "free"),
        planStatus: dbUser?.planStatus || "active",
        planExpiresAt: dbUser?.planExpiresAt || null,
        planActivatedAt: dbUser?.planActivatedAt || null,
        createdAt: dbUser?.createdAt || new Date(),
      },
    });
  } catch {
    res.json({
      success: true,
      user: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        image: null,
        phoneNumber: "",
        company: "",
        role: req.user!.role ?? "user",
        aiCreditsRemaining: req.user!.aiCreditsRemaining ?? 5,
        plan: req.user!.role === "superadmin" ? "business" : "free",
        planStatus: "active",
        createdAt: new Date(),
      },
    });
  }
});

/**
 * PATCH /api/user/profile
 * Update profile details: name, image (avatar), phoneNumber, company
 */
router.patch("/profile", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, image, phoneNumber, company } = req.body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
      return;
    }

    const updateDoc: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof name === "string") updateDoc.name = name.trim();
    if (typeof image === "string") updateDoc.image = image.trim();
    if (typeof phoneNumber === "string") updateDoc.phoneNumber = phoneNumber.trim();
    if (typeof company === "string") updateDoc.company = company.trim();

    try {
      const client = getMongoClient();
      const db = client.db(DB_NAME);

      await db.collection("user").updateOne(
        {
          $or: [{ id: req.user!.id }, { _id: req.user!.id as any }, { email: req.user!.email }],
        },
        { $set: updateDoc },
        { upsert: false }
      );
    } catch (dbErr) {
      console.warn("MongoDB profile update fallback:", dbErr);
    }

    // Sync in-memory dev user if present
    const devUser = devUsers.find(
      (u) => u.id === req.user!.id || u.email.toLowerCase() === req.user!.email.toLowerCase()
    );
    if (devUser) {
      if (updateDoc.name) devUser.name = updateDoc.name as string;
    }

    // Update req.user in memory
    if (updateDoc.name) req.user!.name = updateDoc.name as string;

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: req.user!.id,
        name: (updateDoc.name as string) || req.user!.name,
        email: req.user!.email,
        image: updateDoc.image !== undefined ? updateDoc.image : null,
        phoneNumber: updateDoc.phoneNumber || "",
        company: updateDoc.company || "",
        role: req.user!.role || "user",
        aiCreditsRemaining: req.user!.aiCreditsRemaining ?? 5,
      },
    });
  } catch (err: any) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update profile." });
  }
});

/**
 * POST /api/user/change-password
 * Change password by verifying currentPassword and setting newPassword
 */
router.post("/change-password", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== "string") {
      res.status(400).json({ success: false, message: "Current password is required." });
      return;
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ success: false, message: "New password must be different from current password." });
      return;
    }

    try {
      const client = getMongoClient();
      const db = client.db(DB_NAME);

      const dbUser = await db.collection("user").findOne({
        $or: [{ id: req.user!.id }, { _id: req.user!.id as any }, { email: req.user!.email }],
      });

      const userId = dbUser?.id || dbUser?._id?.toString() || req.user!.id;

      // Find credential account in Better Auth account collection
      const account = await db.collection("account").findOne({
        $or: [
          { userId: userId, providerId: "credential" },
          { accountId: req.user!.email, providerId: "credential" },
        ],
      });

      if (account && account.password) {
        let isValid = false;
        try {
          isValid = await verifyPassword({
            password: currentPassword,
            hash: account.password,
          });
        } catch {
          isValid = account.password === currentPassword;
        }

        if (!isValid && account.password !== currentPassword) {
          res.status(400).json({ success: false, message: "Current password is incorrect." });
          return;
        }

        const newHash = await hashPassword(newPassword);
        await db.collection("account").updateOne(
          { _id: account._id },
          { $set: { password: newHash, updatedAt: new Date() } }
        );
      } else {
        // Fallback for dev mode users or newly seeded accounts
        const devUser = devUsers.find(
          (u) => u.id === req.user!.id || u.email.toLowerCase() === req.user!.email.toLowerCase()
        );
        if (devUser) {
          if (devUser.passwordHash && devUser.passwordHash !== currentPassword) {
            res.status(400).json({ success: false, message: "Current password is incorrect." });
            return;
          }
          devUser.passwordHash = newPassword;
        } else {
          // If no credential account was found, create one with new hash
          const newHash = await hashPassword(newPassword);
          await db.collection("account").insertOne({
            id: `acc_${Date.now()}`,
            userId: userId,
            accountId: req.user!.email,
            providerId: "credential",
            password: newHash,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      createNotification({
        recipientRole: "client",
        recipientEmail: req.user!.email,
        type: "security",
        title: "Password Changed 🔒",
        message: "Your account password was successfully updated.",
        link: "/dashboard/settings",
      }).catch(() => {});

      res.json({
        success: true,
        message: "Password changed successfully.",
      });
    } catch (dbErr: any) {
      // In-memory dev fallback check
      const devUser = devUsers.find(
        (u) => u.id === req.user!.id || u.email.toLowerCase() === req.user!.email.toLowerCase()
      );
      if (devUser) {
        if (devUser.passwordHash && devUser.passwordHash !== currentPassword) {
          res.status(400).json({ success: false, message: "Current password is incorrect." });
          return;
        }
        devUser.passwordHash = newPassword;
        res.json({ success: true, message: "Password updated successfully (dev)." });
        return;
      }

      throw dbErr;
    }
  } catch (err: any) {
    console.error("Error changing password:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to change password." });
  }
});

export default router;
