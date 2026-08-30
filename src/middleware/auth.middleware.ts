import { Request, Response, NextFunction } from "express";
import { getAuth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

// Extend Express Request to carry user session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        aiCreditsRemaining: number;
        [key: string]: unknown;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
        [key: string]: unknown;
      };
    }
  }
}

/**
 * Require an authenticated session.
 * Attaches req.user and req.session. Returns 401 if not authenticated.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    req.user = session.user as Request["user"];
    req.session = session.session as Request["session"];
    next();
  } catch {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

/**
 * Require the authenticated user to have role "admin".
 * Must be used after requireAuth.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ success: false, message: "Forbidden: Admins only" });
    return;
  }
  next();
}
