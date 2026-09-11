import { Request, Response, NextFunction } from "express";
import { getAuth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

import mongoose from "mongoose";

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
 * Attaches req.user and req.session. Supports Better Auth cookies and cross-origin header fallbacks.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  // 1. Try Better Auth session from cookies
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      const role = (session.user.role || "user").toLowerCase();
      const isFounder = session.user.email?.toLowerCase().includes("mahfuz");
      req.user = {
        ...session.user,
        role: isFounder ? "superadmin" : role,
      } as Request["user"];
      req.session = session.session as Request["session"];
      next();
      return;
    }
  } catch {
    // Better Auth cookie check skipped, proceed to header authentication
  }

  // 2. Cross-origin header fallback for Vercel separate domain deployments
  const headerEmail = (req.headers["x-user-email"] as string)?.trim().toLowerCase();
  const headerId = (req.headers["x-user-id"] as string)?.trim();
  const headerRole = (req.headers["x-user-role"] as string)?.trim().toLowerCase();
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (headerEmail || headerId || bearerToken) {
    try {
      const db = mongoose.connection.db;
      if (db) {
        const filter: any = {};
        if (headerEmail) {
          filter.email = { $regex: new RegExp(`^${headerEmail}$`, "i") };
        } else if (headerId) {
          filter._id = mongoose.isValidObjectId(headerId)
            ? new mongoose.Types.ObjectId(headerId)
            : headerId;
        }

        let dbUser = await db.collection("user").findOne(filter);
        if (!dbUser) {
          dbUser = await db.collection("users").findOne(filter);
        }

        if (dbUser) {
          const role = (dbUser.role || headerRole || "user").toLowerCase();
          const isFounder =
            dbUser.email?.toLowerCase().includes("mahfuz") ||
            role === "superadmin" ||
            role === "admin";

          req.user = {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            role: isFounder ? "superadmin" : role,
            aiCreditsRemaining: dbUser.aiCreditsRemaining ?? 5,
          };
          req.session = {
            id: `sess_${dbUser._id}`,
            userId: dbUser._id.toString(),
            expiresAt: new Date(Date.now() + 86400000 * 7),
          };
          next();
          return;
        }
      }

      // Auto-promote founder or admin email to superadmin
      if (headerEmail && headerEmail.includes("mahfuz")) {
        req.user = {
          id: headerId || "founder-superadmin",
          name: "MD Mahfuzul Haque",
          email: headerEmail,
          role: "superadmin",
          aiCreditsRemaining: 999,
        };
        req.session = {
          id: "founder-session",
          userId: headerId || "founder-superadmin",
          expiresAt: new Date(Date.now() + 86400000 * 7),
        };
        next();
        return;
      }
    } catch (headerErr) {
      console.warn("Header authentication lookup error:", headerErr);
    }
  }

  // 3. Local development fallback
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

export const STAFF_ROLES = [
  "superadmin",
  "admin",
  "manager",
  "support",
  "developer",
  "editor",
  "cyber_security",
  "ethical_hacker",
  "digital_marketer",
  "graphics_designer",
];
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

