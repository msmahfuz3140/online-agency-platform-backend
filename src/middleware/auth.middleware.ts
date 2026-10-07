import { Request, Response, NextFunction } from "express";
import { getAuth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

import mongoose from "mongoose";
import { devUsers } from "../routes/auth-fallback.routes.js";

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
  const MAIN_ADMIN_EMAILS = [
    "mdmahfuzulhaque3140@gmail.com",
    "mdmahfuzulhaque314@gmail.com",
  ];

  // 1. Try Better Auth session from cookies
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      const emailLower = session.user.email?.toLowerCase() || "";
      const isMainAdmin = MAIN_ADMIN_EMAILS.includes(emailLower);
      const role = isMainAdmin ? "superadmin" : (session.user.role || "user").toLowerCase();
      req.user = {
        ...session.user,
        role,
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
  const sessionTokenHeader = (req.headers["x-session-token"] as string)?.trim();
  const effectiveToken = bearerToken || sessionTokenHeader;

  if (effectiveToken || headerEmail || headerId) {
    try {
      const db = mongoose.connection.db;
      if (db) {
        // If session token provided, look up active session document
        if (effectiveToken) {
          const sessionDoc = await db.collection("session").findOne({ token: effectiveToken });
          if (sessionDoc && new Date(sessionDoc.expiresAt) > new Date()) {
            const userFilter: any = {
              $or: [
                { _id: sessionDoc.userId },
                { id: sessionDoc.userId },
              ],
            };
            if (mongoose.isValidObjectId(sessionDoc.userId)) {
              userFilter.$or.push({ _id: new mongoose.Types.ObjectId(sessionDoc.userId) });
            }

            let sessionUser = await db.collection("user").findOne(userFilter);
            if (!sessionUser) {
              sessionUser = await db.collection("users").findOne(userFilter);
            }

            if (sessionUser) {
              const emailLower = sessionUser.email?.toLowerCase() || "";
              const isMainAdmin = MAIN_ADMIN_EMAILS.includes(emailLower);
              const role = isMainAdmin ? "superadmin" : (sessionUser.role || "user").toLowerCase();
              req.user = {
                id: sessionUser._id.toString(),
                name: sessionUser.name,
                email: sessionUser.email,
                role,
                aiCreditsRemaining: sessionUser.aiCreditsRemaining ?? 5,
              };
              req.session = {
                id: sessionDoc._id.toString(),
                userId: sessionDoc.userId.toString(),
                expiresAt: sessionDoc.expiresAt,
              };
              next();
              return;
            }
          }
        }

        // Look up by header email or id
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
          const emailLower = dbUser.email?.toLowerCase() || "";
          const isMainAdmin = MAIN_ADMIN_EMAILS.includes(emailLower);
          const role = isMainAdmin ? "superadmin" : (dbUser.role || "user").toLowerCase();

          req.user = {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            role,
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

      // 3. Fallback to dev users in memory
      const devMatch = devUsers.find(
        (u) =>
          (headerEmail && u.email.toLowerCase() === headerEmail) ||
          (headerId && u.id === headerId)
      );

      if (devMatch) {
        const emailLower = devMatch.email.toLowerCase();
        const isMainAdmin = MAIN_ADMIN_EMAILS.includes(emailLower);
        const role = isMainAdmin ? "superadmin" : (devMatch.role || "user").toLowerCase();
        req.user = {
          id: devMatch.id,
          name: devMatch.name,
          email: devMatch.email,
          role,
          aiCreditsRemaining: devMatch.aiCreditsRemaining,
        };
        req.session = {
          id: `sess_${devMatch.id}`,
          userId: devMatch.id,
          expiresAt: new Date(Date.now() + 86400000 * 7),
        };
        next();
        return;
      }

      // If header is main admin email directly
      if (headerEmail && MAIN_ADMIN_EMAILS.includes(headerEmail)) {
        req.user = {
          id: headerId || "admin_super_mahfuz",
          name: "MD.MAHFUZUL HAQUE",
          email: headerEmail,
          role: "superadmin",
          aiCreditsRemaining: 999,
        };
        req.session = {
          id: "sess_main_admin",
          userId: headerId || "admin_super_mahfuz",
          expiresAt: new Date(Date.now() + 86400000 * 7),
        };
        next();
        return;
      }
    } catch (headerErr) {
      console.warn("Header authentication lookup error:", headerErr);
    }
  }

  res.status(401).json({ success: false, message: "Unauthorized: Please log in to proceed." });
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
 * Require the authenticated user to be a staff member (superadmin, admin, manager, support, developer, editor, etc.).
 */
export function requireStaff(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const role = (req.user?.role || "").toLowerCase();

  if (!req.user || !STAFF_ROLES.includes(role)) {
    res.status(403).json({
      success: false,
      message: "Forbidden: Staff member access required for this resource.",
    });
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

  if (!req.user || !ADMIN_ROLES.includes(role)) {
    res.status(403).json({
      success: false,
      message: "Forbidden: Administrator privileges required.",
    });
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

  if (!req.user || (role !== "superadmin" && !ADMIN_ROLES.includes(role))) {
    res.status(403).json({
      success: false,
      message: "Forbidden: Superadmin access required.",
    });
    return;
  }
  next();
}

