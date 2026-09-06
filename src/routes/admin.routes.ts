import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import {
  requireAuth,
  requireAdmin,
  requireStaff,
  requireSuperAdmin,
  STAFF_ROLES,
} from "../middleware/auth.middleware.js";
import { getMongoClient } from "../config/db.js";
import Contact from "../models/Contact.js";
import ProjectRequest from "../models/ProjectRequest.js";
import {
  sendSprintUpdateToClient,
  sendProjectCompletionEmails,
} from "../services/email.service.js";
import { createNotification } from "../services/notification.service.js";

const router = Router();
const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";

function getDb() {
  if (mongoose.connection?.db) {
    return mongoose.connection.db;
  }
  return getMongoClient().db(DB_NAME);
}

// ─── Stats Overview ────────────────────────────────────────────────────────────
router.get(
  "/stats",
  requireAuth,
  requireStaff,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const [totalUsers, totalRequests, totalMessages, totalTeamMembers] = await Promise.all([
        db.collection("user").countDocuments(),
        db.collection("projectrequests").countDocuments(),
        db.collection("contacts").countDocuments(),
        db.collection("user").countDocuments({ role: { $in: STAFF_ROLES } }),
      ]);
      res.json({
        success: true,
        data: {
          totalUsers,
          totalRequests,
          totalMessages,
          totalTeamMembers: Math.max(totalTeamMembers, 4),
        },
      });
    } catch (err) {
      console.error("Admin stats error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
  }
);


// ─── Users ─────────────────────────────────────────────────────────────────────
router.get(
  "/users",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const page = parseInt(String(req.query.page || "1"), 10);
      const limit = parseInt(String(req.query.limit || "20"), 10);
      const search = String(req.query.search || "");
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const [users, total] = await Promise.all([
        db.collection("user").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
        db.collection("user").countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role || "user",
          isBlocked: u.isBlocked || false,
          aiCreditsRemaining: u.aiCreditsRemaining ?? 5,
          createdAt: u.createdAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      console.error("Admin users list error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  }
);

// Block / unblock user
router.patch(
  "/users/:id/block",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const { id } = req.params;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await db.collection("user").findOne({ _id: id } as any);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      const newBlocked = !user.isBlocked;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.collection("user").updateOne({ _id: id } as any, { $set: { isBlocked: newBlocked } });
      res.json({ success: true, data: { isBlocked: newBlocked } });
    } catch (err) {
      console.error("Admin block user error:", err);
      res.status(500).json({ success: false, message: "Failed to update user" });
    }
  }
);

// Delete user
router.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const { id } = req.params;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await db.collection("user").deleteOne({ _id: id } as any);
      if (result.deletedCount === 0) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      // Also delete related accounts/sessions
      await Promise.allSettled([
        db.collection("account").deleteMany({ userId: id }),
        db.collection("session").deleteMany({ userId: id }),
      ]);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      console.error("Admin delete user error:", err);
      res.status(500).json({ success: false, message: "Failed to delete user" });
    }
  }
);

// ─── Project Requests ──────────────────────────────────────────────────────────
router.get(
  "/requests",
  requireAuth,
  requireStaff,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const page = parseInt(String(req.query.page || "1"), 10);
      const limit = parseInt(String(req.query.limit || "20"), 10);
      const status = String(req.query.status || "");
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (status && status !== "all") filter.status = status;

      const [requests, total] = await Promise.all([
        db.collection("projectrequests").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
        db.collection("projectrequests").countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: requests,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      console.error("Admin requests list error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch requests" });
    }
  }
);

// Update request sprint & delivery management (admin)
const handleUpdateRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const {
      status,
      adminNotes,
      progress,
      leadEngineer,
      sprintPhase,
      targetLaunch,
      stagingUrl,
      deliverables,
      newUpdate,
    } = req.body;

    const validStatuses = [
      "pending",
      "reviewing",
      "in-progress",
      "review-ready",
      "completed",
      "cancelled",
    ];

    const updateFields: Record<string, unknown> = {};

    if (status) {
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: "Invalid status value" });
        return;
      }
      updateFields.status = status;
    }

    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
    if (progress !== undefined) updateFields.progress = Math.min(100, Math.max(0, Number(progress) || 0));
    if (leadEngineer !== undefined) updateFields.leadEngineer = leadEngineer;
    if (sprintPhase !== undefined) updateFields.sprintPhase = sprintPhase;
    if (targetLaunch !== undefined) updateFields.targetLaunch = targetLaunch;
    if (stagingUrl !== undefined) updateFields.stagingUrl = stagingUrl;
    if (deliverables !== undefined && Array.isArray(deliverables)) {
      updateFields.deliverables = deliverables;
    }

    const updateQuery: any = { $set: updateFields };

    if (newUpdate && newUpdate.title && newUpdate.note) {
      updateQuery.$push = {
        updates: {
          id: `upd_${Date.now()}`,
          title: newUpdate.title,
          note: newUpdate.note,
          date: new Date(),
          postedBy: (req as any).user?.name || "MD Mahfuzul Haque",
        },
      };
    }

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      const updated = await ProjectRequest.findByIdAndUpdate(id, updateQuery, { new: true });
      if (!updated) {
        res.status(404).json({ success: false, message: "Project request not found" });
        return;
      }

      // Notify client via email if milestone was published or progress/status updated
      if (newUpdate || status === "review-ready" || status === "completed" || progress !== undefined) {
        if (status === "completed") {
          sendProjectCompletionEmails({
            clientName: updated.clientName,
            clientEmail: updated.clientEmail,
            projectTitle: updated.projectTitle,
            stagingUrl: updated.stagingUrl,
            approved: true,
          }).catch((e) => console.error("❌ Error sending admin completion email:", e));

          createNotification({
            recipientRole: "client",
            recipientEmail: updated.clientEmail,
            type: "sprint_update",
            title: "Project Deployed Live 🚀",
            message: `Congratulations! "${updated.projectTitle}" has reached 100% completion.`,
            link: "/dashboard?tab=projects",
          });
        } else {
          sendSprintUpdateToClient({
            clientName: updated.clientName,
            clientEmail: updated.clientEmail,
            projectTitle: updated.projectTitle,
            status: updated.status,
            progress: updated.progress,
            sprintPhase: updated.sprintPhase,
            stagingUrl: updated.stagingUrl,
            newUpdateTitle: newUpdate?.title,
            newUpdateNote: newUpdate?.note,
          }).catch((e) => console.error("❌ Error sending sprint update email:", e));

          createNotification({
            recipientRole: "client",
            recipientEmail: updated.clientEmail,
            type: "sprint_update",
            title: status === "review-ready" ? "Deliverables Ready for Review ⭐" : (newUpdate?.title || `Sprint Progress: ${updated.progress}%`),
            message: newUpdate?.note || `Project "${updated.projectTitle}" updated to ${updated.status}.`,
            link: "/dashboard?tab=projects",
          });
        }
      }

      res.json({ success: true, message: "Project sprint updated successfully", data: updated });
      return;
    }

    // Direct MongoDB fallback
    const db = getDb();
    const queryObj = mongoose.isValidObjectId(id)
      ? { _id: new mongoose.Types.ObjectId(id) }
      : ({ _id: id } as any);
    const result = await db.collection("projectrequests").updateOne(queryObj, updateQuery);

    if (result.matchedCount === 0) {
      res.status(404).json({ success: false, message: "Project request not found" });
      return;
    }

    const updatedDoc = (await db.collection("projectrequests").findOne(queryObj)) as any;
    if (updatedDoc && (newUpdate || status === "review-ready" || status === "completed" || progress !== undefined)) {
      if (status === "completed") {
        sendProjectCompletionEmails({
          clientName: updatedDoc.clientName,
          clientEmail: updatedDoc.clientEmail,
          projectTitle: updatedDoc.projectTitle,
          stagingUrl: updatedDoc.stagingUrl,
          approved: true,
        }).catch((e) => console.error("❌ Error sending admin completion email (direct):", e));
      } else {
        sendSprintUpdateToClient({
          clientName: updatedDoc.clientName,
          clientEmail: updatedDoc.clientEmail,
          projectTitle: updatedDoc.projectTitle,
          status: updatedDoc.status,
          progress: updatedDoc.progress,
          sprintPhase: updatedDoc.sprintPhase,
          stagingUrl: updatedDoc.stagingUrl,
          newUpdateTitle: newUpdate?.title,
          newUpdateNote: newUpdate?.note,
        }).catch((e) => console.error("❌ Error sending sprint update email (direct):", e));
      }
    }

    res.json({ success: true, message: "Project sprint updated", data: updatedDoc });
  } catch (err) {
    console.error("Admin update project request error:", err);
    res.status(500).json({ success: false, message: "Failed to update project request" });
  }
};

router.patch("/requests/:id/status", requireAuth, requireStaff, handleUpdateRequest);
router.patch("/requests/:id", requireAuth, requireStaff, handleUpdateRequest);

// ─── Contact Messages ──────────────────────────────────────────────────────────
router.get(
  "/messages",
  requireAuth,
  requireStaff,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(String(req.query.page || "1"), 10);
      const limit = parseInt(String(req.query.limit || "50"), 10);
      const status = String(req.query.status || "");
      const category = String(req.query.category || "");
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (status && status !== "all") filter.status = status;
      if (category && category !== "all") {
        filter.$or = [
          { category: category },
          { subject: { $regex: category, $options: "i" } },
        ];
      }

      const [messages, total] = await Promise.all([
        Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Contact.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: messages,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      console.error("Admin messages list error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
  }
);

// Update message status (read, archive, replied)
router.patch(
  "/messages/:id/status",
  requireAuth,
  requireStaff,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ["unread", "read", "archived", "replied"];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: "Invalid status" });
        return;
      }
      
      const updated = await Contact.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after" }
      );
      if (!updated) {
        const { ObjectId } = await import("mongodb");
        const idStr = String(id);
        const query: any = ObjectId.isValid(idStr) ? { _id: new ObjectId(idStr) } : { _id: idStr };
        await getDb().collection("contacts").updateOne(query, { $set: { status } });
      }
      res.json({ success: true, message: "Message status updated" });
    } catch (err) {
      console.error("Admin update message status error:", err);
      res.status(500).json({ success: false, message: "Failed to update message status" });
    }
  }
);

// Get single message thread with all replies
router.get(
  "/messages/:id",
  requireAuth,
  requireStaff,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      let message = await Contact.findById(id).lean();
      if (!message) {
        const { ObjectId } = await import("mongodb");
        const idStr = String(id);
        const query: any = ObjectId.isValid(idStr) ? { _id: new ObjectId(idStr) } : { _id: idStr };
        message = (await getDb().collection("contacts").findOne(query)) as any;
      }
      if (!message) {
        res.status(404).json({ success: false, message: "Message not found" });
        return;
      }

      // Automatically mark unread message as read when opened
      if (message.status === "unread") {
        await Contact.findByIdAndUpdate(id, { status: "read" });
        message.status = "read";
      }

      res.json({ success: true, data: message });
    } catch (err) {
      console.error("Admin get message error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch message" });
    }
  }
);

// Post Admin Reply to Contact Message Thread
router.post(
  "/messages/:id/reply",
  requireAuth,
  requireStaff,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { message, senderName } = req.body;

      if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({ success: false, message: "Reply message is required" });
        return;
      }

      const currentUser = (req as any).user;
      const replyItem = {
        sender: "admin" as const,
        senderName: senderName || currentUser?.name || "Admin Support",
        senderEmail: currentUser?.email || "support@nexora.agency",
        message: message.trim(),
        createdAt: new Date(),
      };

      let updated = await Contact.findByIdAndUpdate(
        id,
        {
          $push: { replies: replyItem },
          $set: { status: "replied" },
        },
        { returnDocument: "after" }
      ).lean();

      if (!updated) {
        const { ObjectId } = await import("mongodb");
        const idStr = String(id);
        const query: any = ObjectId.isValid(idStr) ? { _id: new ObjectId(idStr) } : { _id: idStr };
        await getDb().collection("contacts").updateOne(query, {
          $push: { replies: replyItem as any },
          $set: { status: "replied" },
        });
        updated = (await getDb().collection("contacts").findOne(query)) as any;
      }

      if (updated && (updated as any).email) {
        createNotification({
          recipientRole: "client",
          recipientEmail: (updated as any).email,
          type: "reply",
          title: "New Admin Reply",
          message: `${replyItem.senderName} replied: "${message.trim().slice(0, 70)}"`,
          link: "/dashboard/messages",
        });
      }

      res.json({
        success: true,
        message: "Reply sent successfully",
        data: updated,
      });
    } catch (err) {
      console.error("Admin message reply error:", err);
      res.status(500).json({ success: false, message: "Failed to send reply" });
    }
  }
);

// ─── Default Team Members Seed Data ───────────────────────────────────────────
const DEFAULT_STAFF = [
  {
    name: "MD Mahfuzul Haque",
    email: "mahfuzul@nexora.agency",
    role: "superadmin",
    department: "Computer Science & Technology (CST)",
    title: "Founder & Lead Systems Architect",
    permissions: ["manage_team", "manage_requests", "reply_messages", "manage_users", "view_analytics", "system_settings"],
    status: "active",
    avatar: "MH",
  },
  {
    name: "Jahidul Islam",
    email: "jahidul@nexora.agency",
    role: "manager",
    department: "UI/UX & Design Systems",
    title: "Co-Founder & Head of UI/UX",
    permissions: ["manage_requests", "reply_messages", "view_users", "view_analytics"],
    status: "active",
    avatar: "JI",
  },
  {
    name: "Saif Khan",
    email: "saif@nexora.agency",
    role: "developer",
    department: "Cyber Security & Infrastructure",
    title: "Co-Founder & Cyber Security Lead",
    permissions: ["manage_requests", "view_analytics"],
    status: "active",
    avatar: "SK",
  },
  {
    name: "Koushik Roy",
    email: "koushik@nexora.agency",
    role: "support",
    department: "Client Support & Security Auditing",
    title: "Lead Security Auditor & Support",
    permissions: ["reply_messages", "manage_requests"],
    status: "active",
    avatar: "KR",
  },
];

// ─── Team Management ──────────────────────────────────────────────────────────
// GET /api/admin/team — List all team members with roles and permissions
router.get(
  "/team",
  requireAuth,
  requireStaff,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      // Look for staff in user collection
      const staffUsers = await db
        .collection("user")
        .find({ role: { $in: STAFF_ROLES } })
        .toArray();

      // If fewer than default staff members exist, ensure default staff exist
      if (staffUsers.length < DEFAULT_STAFF.length) {
        for (const defaultMember of DEFAULT_STAFF) {
          const exists = staffUsers.some((u) => u.email === defaultMember.email);
          if (!exists) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await db.collection("user").updateOne(
              { email: defaultMember.email } as any,
              {
                $setOnInsert: {
                  _id: "team_" + defaultMember.avatar.toLowerCase(),
                  name: defaultMember.name,
                  email: defaultMember.email,
                  role: defaultMember.role,
                  department: defaultMember.department,
                  title: defaultMember.title,
                  permissions: defaultMember.permissions,
                  status: defaultMember.status,
                  isBlocked: false,
                  createdAt: new Date(),
                  aiCreditsRemaining: 100,
                },
              },
              { upsert: true }
            );
          }
        }
      }

      // Re-fetch all staff
      const allStaff = await db
        .collection("user")
        .find({ role: { $in: STAFF_ROLES } })
        .sort({ role: 1, createdAt: 1 })
        .toArray();

      // Format response
      const data = allStaff.map((u) => {
        const initials = u.name
          ? u.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "TM";

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role || "support",
          department: u.department || "Operations",
          title: u.title || "Team Specialist",
          permissions: u.permissions || ["manage_requests"],
          status: u.isBlocked ? "suspended" : (u.status || "active"),
          avatar: initials,
          createdAt: u.createdAt || new Date(),
        };
      });

      res.json({ success: true, data });
    } catch (err) {
      console.error("Admin team list error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch team members" });
    }
  }
);

// POST /api/admin/team — Add / Invite new team member (Superadmin only)
router.post(
  "/team",
  requireAuth,
  requireSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const { name, email, role, department, title, permissions } = req.body;

      if (!name || !email) {
        res.status(400).json({ success: false, message: "Name and email are required" });
        return;
      }

      const assignedRole = STAFF_ROLES.includes(role) ? role : "support";
      const assignedPermissions = Array.isArray(permissions) ? permissions : ["manage_requests"];

      // Check if user already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await db.collection("user").findOne({ email: email.toLowerCase().trim() } as any);

      if (existing) {
        // Upgrade existing user to team member
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.collection("user").updateOne(
          { _id: existing._id } as any,
          {
            $set: {
              role: assignedRole,
              department: department || "Operations",
              title: title || "Staff Specialist",
              permissions: assignedPermissions,
              status: "active",
              isBlocked: false,
            },
          }
        );

        res.json({
          success: true,
          message: `${name} has been granted ${assignedRole} access to the team!`,
          data: { id: existing._id, name, email, role: assignedRole },
        });
        return;
      }

      // Create new team member user
      const newId = "user_" + Date.now();
      await db.collection("user").insertOne({
        _id: newId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: assignedRole,
        department: department || "Operations",
        title: title || "Staff Specialist",
        permissions: assignedPermissions,
        status: "active",
        isBlocked: false,
        aiCreditsRemaining: 100,
        createdAt: new Date(),
      } as any);

      res.status(201).json({
        success: true,
        message: `Team member ${name} added successfully!`,
        data: { id: newId, name, email, role: assignedRole },
      });
    } catch (err) {
      console.error("Admin add team error:", err);
      res.status(500).json({ success: false, message: "Failed to add team member" });
    }
  }
);

// PATCH /api/admin/team/:id — Update role, department, or permissions (Superadmin only)
router.patch(
  "/team/:id",
  requireAuth,
  requireSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { role, department, title, permissions, status } = req.body;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await db.collection("user").findOne({ _id: id } as any);
      if (!user) {
        res.status(404).json({ success: false, message: "Team member not found" });
        return;
      }

      const updateFields: Record<string, unknown> = {};
      if (role && STAFF_ROLES.includes(role)) updateFields.role = role;
      if (department !== undefined) updateFields.department = department;
      if (title !== undefined) updateFields.title = title;
      if (Array.isArray(permissions)) updateFields.permissions = permissions;
      if (status !== undefined) {
        updateFields.status = status;
        updateFields.isBlocked = status === "suspended";
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.collection("user").updateOne({ _id: id } as any, { $set: updateFields });

      res.json({ success: true, message: "Team member updated successfully" });
    } catch (err) {
      console.error("Admin update team error:", err);
      res.status(500).json({ success: false, message: "Failed to update team member" });
    }
  }
);

// DELETE /api/admin/team/:id — Remove from team / Demote to regular user (Superadmin only)
router.delete(
  "/team/:id",
  requireAuth,
  requireSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const { id } = req.params;

      // Demote to client/user rather than deleting the account completely
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await db.collection("user").updateOne(
        { _id: id } as any,
        {
          $set: {
            role: "user",
            permissions: [],
            status: "inactive",
          },
        }
      );

      if (result.matchedCount === 0) {
        res.status(404).json({ success: false, message: "Team member not found" });
        return;
      }

      res.json({ success: true, message: "Team member access revoked and demoted to user" });
    } catch (err) {
      console.error("Admin remove team member error:", err);
      res.status(500).json({ success: false, message: "Failed to remove team member" });
    }
  }
);

// ─── Personal Workspace / Role-Based Hub ───────────────────────────────────────
// GET /api/admin/workspace — Returns personalized dashboard data for logged-in staff
router.get(
  "/workspace",
  requireAuth,
  requireStaff,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();
      const userRole = req.user?.role || "support";

      const [recentRequests, recentMessages, openRequestsCount, unreadMessagesCount] =
        await Promise.all([
          db.collection("projectrequests").find().sort({ createdAt: -1 }).limit(6).toArray(),
          db.collection("contacts").find().sort({ createdAt: -1 }).limit(6).toArray(),
          db.collection("projectrequests").countDocuments({ status: { $in: ["pending", "in-progress"] } }),
          db.collection("contacts").countDocuments({ status: "unread" }),
        ]);

      res.json({
        success: true,
        data: {
          role: userRole,
          name: req.user?.name,
          email: req.user?.email,
          recentRequests,
          recentMessages,
          metrics: {
            openRequestsCount,
            unreadMessagesCount,
            activeSprints: 3,
            avgResponseTime: "1.4 hrs",
          },
        },
      });
    } catch (err) {
      console.error("Admin workspace error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch workspace data" });
    }
  }
);

export default router;

