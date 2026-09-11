import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getMongoClient } from "../config/db.js";

const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";
const router = Router();

/**
 * GET /api/user/me
 * Returns the currently logged-in user's profile (role, aiCreditsRemaining, active subscription plan, etc.)
 * Requires authentication.
 */
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = getMongoClient();
    const db = client.db(DB_NAME);
    const dbUser = await db.collection("user").findOne({
      $or: [{ id: req.user!.id }, { _id: req.user!.id as any }, { email: req.user!.email }]
    });

    res.json({
      success: true,
      user: {
        id: req.user!.id,
        name: dbUser?.name || req.user!.name,
        email: dbUser?.email || req.user!.email,
        role: dbUser?.role || req.user!.role || "user",
        aiCreditsRemaining: dbUser?.aiCreditsRemaining ?? req.user!.aiCreditsRemaining ?? 5,
        plan: dbUser?.plan || (req.user!.role === "superadmin" ? "business" : "free"),
        planStatus: dbUser?.planStatus || "active",
        planExpiresAt: dbUser?.planExpiresAt || null,
        planActivatedAt: dbUser?.planActivatedAt || null,
      },
    });
  } catch {
    res.json({
      success: true,
      user: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role ?? "user",
        aiCreditsRemaining: req.user!.aiCreditsRemaining ?? 5,
        plan: req.user!.role === "superadmin" ? "business" : "free",
        planStatus: "active",
      },
    });
  }
});

export default router;
