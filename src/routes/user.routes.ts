import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * GET /api/user/me
 * Returns the currently logged-in user's profile (role, aiCreditsRemaining, etc.)
 * Requires authentication.
 */
router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: {
      id: req.user!.id,
      name: req.user!.name,
      email: req.user!.email,
      role: req.user!.role ?? "user",
      aiCreditsRemaining: req.user!.aiCreditsRemaining ?? 5,
    },
  });
});

export default router;
