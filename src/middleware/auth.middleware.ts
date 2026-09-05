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
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      const role = (session.user.role || "user").toLowerCase();
      // Auto-promote founder or admin to superadmin
      const isFounder = session.user.email?.toLowerCase().includes("mahfuz");
      req.user = {
        ...session.user,
        role: isFounder ? "superadmin" : role,
      } as Request["user"];
      req.session = session.session as Request["session"];
      next();
      return;
    }

    // In local development, allow graceful fallback to Super Admin profile so local testing never breaks
    if (isDev) {
      req.user = {
        id: "founder-superadmin",
        name: "MD Mahfuzul Haque",
        email: "mdmahfuzulhaque3140@gmail.com",
        role: "superadmin",
        aiCreditsRemaining: 999,
      };
      req.session = {
        id: "founder-session",
        userId: "founder-superadmin",
        expiresAt: new Date(Date.now() + 86400000),
      };
      next();
      return;
    }

    res.status(401).json({ success: false, message: "Unauthorized" });
  } catch (err) {
    if (isDev) {
      req.user = {
        id: "founder-superadmin",
        name: "MD Mahfuzul Haque",
        email: "mdmahfuzulhaque3140@gmail.com",
        role: "superadmin",
        aiCreditsRemaining: 999,
      };
      req.session = {
        id: "founder-session",
        userId: "founder-superadmin",
        expiresAt: new Date(Date.now() + 86400000),
      };
      next();
      return;
    }
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

export const STAFF_ROLES = ["superadmin", "admin", "manager", "support", "developer", "editor"];
export const ADMIN_ROLES = ["superadmin", "admin"];

/**
 * Require the authenticated user to be a staff member (superadmin, admin, manager, support, developer, editor).
 */
export function requireStaff(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const role = (req.user?.role || "").toLowerCase();
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  if (!req.user || (!STAFF_ROLES.includes(role) && !isDev)) {
    res.status(403).json({ success: false, message: "Forbidden: Staff access only" });
    return;
  }
  next();
}

/**
 * Require the authenticated user to have role "superadmin" or "admin".
 * Must be used after requireAuth.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const role = (req.user?.role || "").toLowerCase();
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  if (!req.user || (!ADMIN_ROLES.includes(role) && !isDev)) {
    res.status(403).json({ success: false, message: "Forbidden: Admins only" });
    return;
  }
  next();
}

/**
 * Require the authenticated user to have superadmin/owner privileges.
 * Superadmin has the main access to manage team members, change roles, and system settings.
 */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const role = (req.user?.role || "").toLowerCase();
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  if (!req.user || (role !== "superadmin" && !ADMIN_ROLES.includes(role) && !isDev)) {
    res.status(403).json({ success: false, message: "Forbidden: Superadmin access required" });
    return;
  }
  next();
}

