import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import {
  requireAuth,
  requireAdmin,
  requireStaff,
  requireSuperAdmin,
  STAFF_ROLES,
} from "../middleware/auth.middleware.js";
import { getMongoClient, connectDB } from "../config/db.js";
import Contact from "../models/Contact.js";
import ProjectRequest from "../models/ProjectRequest.js";
import {
  sendSprintUpdateToClient,
  sendProjectCompletionEmails,
} from "../services/email.service.js";
import { createNotification } from "../services/notification.service.js";
import TeamMember from "../models/TeamMember.js";
import { teamMembersData } from "../data/team.data.js";
import { devUsers } from "./auth-fallback.routes.js";

const router = Router();
const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";

function getDb() {
  if (mongoose.connection?.db) {
    return mongoose.connection.db;
  }
  try {
    return mongoose.connection.getClient().db(DB_NAME);
  } catch {
    return null as any;
  }
}

// ─── Stats Overview ────────────────────────────────────────────────────────────
router.get(
  "/stats",
  requireAuth,
  requireStaff,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      if (mongoose.connection.readyState !== 1) {
        try {
          await connectDB();
        } catch {}
      }
      const db = getDb();
      if (!db) {
        res.json({
          success: true,
          data: {
            totalUsers: devUsers.length,
            totalRequests: 0,
            totalMessages: 0,
            totalTeamMembers: 7,
          },
        });
        return;
      }
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
          totalTeamMembers: Math.max(totalTeamMembers, 7),
        },
      });
    } catch (err) {
      console.error("Admin stats error:", err);
      res.json({
        success: true,
        data: {
          totalUsers: devUsers.length,
          totalRequests: 0,
          totalMessages: 0,
          totalTeamMembers: 7,
        },
      });
    }
  }
);


// ─── Users ─────────────────────────────────────────────────────────────────────
router.get(
  "/users",
  requireAuth,
  requireStaff,
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(String(req.query.page || "1"), 10);
    const limit = parseInt(String(req.query.limit || "50"), 10);
    const search = String(req.query.search || "");
    const skip = (page - 1) * limit;

    try {
      if (mongoose.connection.readyState !== 1) {
        try {
          await connectDB();
        } catch {}
      }
      const db = getDb();
      let users: any[] = [];
      let total = 0;

      if (db) {
        const filter: Record<string, unknown> = {};
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ];
        }

        try {
          const [dbUsers, dbTotal] = await Promise.all([
            db.collection("user").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            db.collection("user").countDocuments(filter),
          ]);
          users = dbUsers;
          total = dbTotal;
        } catch {}

        if (total === 0) {
          try {
            const [pluralUsers, pluralTotal] = await Promise.all([
              db.collection("users").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
              db.collection("users").countDocuments(filter),
            ]);
            if (pluralTotal > 0) {
              users = pluralUsers;
              total = pluralTotal;
            }
          } catch {}
        }
      }

      if (!users || users.length === 0) {
        users = devUsers.map((u) => ({
          _id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isBlocked: false,
          aiCreditsRemaining: u.aiCreditsRemaining,
          createdAt: u.createdAt,
        })) as any;
        total = users.length;
      }

      // Aggregate how many services/projects each user has ordered
      const userEmails = users.map((u: any) => u.email?.toLowerCase()).filter(Boolean);
      const userIds = users.map((u: any) => (u._id ? u._id.toString() : u.id)).filter(Boolean);
      const countsMap = new Map<string, number>();

      if (db && (userEmails.length > 0 || userIds.length > 0)) {
        try {
          const serviceCountsAgg = await db
            .collection("projectrequests")
            .aggregate([
              {
                $match: {
                  $or: [
                    { clientEmail: { $in: userEmails } },
                    { clientId: { $in: userIds } },
                  ],
                },
              },
              {
                $group: {
                  _id: { $toLower: "$clientEmail" },
                  count: { $sum: 1 },
                },
              },
            ])
            .toArray();

          serviceCountsAgg.forEach((item: any) => {
            if (item._id) countsMap.set(String(item._id).toLowerCase(), item.count);
          });
        } catch (aggErr) {
          console.warn("Admin users service counts aggregation warning:", aggErr);
        }
      }

      res.json({
        success: true,
        data: users.map((u: any) => {
          const userEmail = (u.email || "").toLowerCase();
          return {
            id: u._id ? u._id.toString() : (u.id || `usr_${Date.now()}`),
            name: u.name,
            email: u.email,
            role: u.role || "user",
            isBlocked: u.isBlocked || false,
            aiCreditsRemaining: u.aiCreditsRemaining ?? 5,
            servicesCount: countsMap.get(userEmail) || 0,
            createdAt: u.createdAt || new Date(),
          };
        }),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      });
    } catch (err) {
      console.error("Admin users list error:", err);
      res.json({
        success: true,
        data: devUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isBlocked: false,
          aiCreditsRemaining: u.aiCreditsRemaining,
          servicesCount: 0,
          createdAt: u.createdAt,
        })),
        pagination: { page: 1, limit: 20, total: devUsers.length, pages: 1 },
      });
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

// Update user role (Superadmin / Admin only)
router.patch(
  "/users/:id/role",
  requireAuth,
  requireSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { role } = req.body;

      const validRoles = [
        "user",
        "superadmin",
        "admin",
        "manager",
        "developer",
        "cyber_security",
        "ethical_hacker",
        "digital_marketer",
        "graphics_designer",
        "support",
        "editor",
      ];

      if (!role || !validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: `Invalid role specified. Valid roles are: ${validRoles.join(", ")}`,
        });
        return;
      }

      const db = getDb();
      const filter: any = mongoose.isValidObjectId(id)
        ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { _id: id }, { id }] }
        : { $or: [{ _id: id }, { id }] };

      await db.collection("user").updateOne(filter, {
        $set: { role, updatedAt: new Date() },
      });

      await db.collection("users").updateOne(filter, {
        $set: { role, updatedAt: new Date() },
      });

      // Update devUsers if matched
      const devMatch = devUsers.find((u) => u.id === id || u.email.toLowerCase() === id.toLowerCase());
      if (devMatch) {
        devMatch.role = role;
      }

      // If promoted to staff role, also ensure they are in TeamMember collection
      const targetUser =
        (await db.collection("user").findOne(filter)) ||
        (await db.collection("users").findOne(filter));

      if (targetUser && STAFF_ROLES.includes(role)) {
        const uEmail = (targetUser.email || "").toLowerCase().trim();
        const existingTeam = await TeamMember.findOne({
          $or: [{ "socialLinks.email": uEmail }, { name: targetUser.name }],
        });

        if (!existingTeam && targetUser.name) {
          const cleanSlug = targetUser.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          const initials = targetUser.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          await TeamMember.create({
            slug: `${cleanSlug}-${Date.now().toString().slice(-4)}`,
            name: targetUser.name,
            role: role.replace("_", " ").toUpperCase(),
            shortRole: role,
            department: "Nexora Operations & Engineering",
            institute: "Nexora Agency",
            location: "Dhaka, Bangladesh",
            tagline: `Specialist delivering ${role.replace("_", " ")} operations at Nexora.`,
            bio: `${targetUser.name} is a designated ${role.replace("_", " ")} on the Nexora team.`,
            fullBio: [`${targetUser.name} specializes in high-quality engineering and client delivery.`],
            philosophy: "Execution and precision.",
            initials: initials || "NX",
            image: targetUser.image || targetUser.avatar || "",
            gradient: "from-primary-500/20 to-surface-2",
            roleBadgeVariant: "primary",
            stats: [{ label: "Projects Completed", value: "1+" }],
            coreExpertise: [],
            featuredProjects: [],
            skills: [],
            categorizedSkills: [],
            credentials: [],
            socialLinks: { email: uEmail },
            order: (await TeamMember.countDocuments()) + 1,
          });
        }
      }

      res.json({
        success: true,
        message: `User role has been updated to "${role}".`,
        data: { id, role },
      });
    } catch (err) {
      console.error("Admin update role error:", err);
      res.status(500).json({ success: false, message: "Failed to update user role" });
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
    role: "developer",
    department: "Computer Science & Technology (CST)",
    title: "Founder & Lead Systems Architect",
    permissions: ["manage_team", "manage_requests", "reply_messages", "manage_users", "view_analytics", "system_settings"],
    status: "active",
    avatar: "MH",
  },
  {
    name: "Jahidul Islam",
    email: "jahidul@nexora.agency",
    role: "graphics_designer",
    department: "UI/UX & Graphics Design",
    title: "Co-Founder & Head of UI/UX & Graphics",
    permissions: ["manage_requests", "reply_messages", "view_users", "view_analytics"],
    status: "active",
    avatar: "JI",
  },
  {
    name: "Saif Khan",
    email: "saif@nexora.agency",
    role: "cyber_security",
    department: "Cyber Security & Infrastructure",
    title: "Co-Founder & Cyber Security Lead",
    permissions: ["manage_requests", "view_analytics"],
    status: "active",
    avatar: "SK",
  },
  {
    name: "Koushik Komar Paul",
    email: "koushik@nexora.agency",
    role: "ethical_hacker",
    department: "Offensive Security & Ethical Hacking",
    title: "Lead Ethical Hacker & Security Auditor",
    permissions: ["reply_messages", "manage_requests", "view_analytics"],
    status: "active",
    avatar: "KP",
  },
  {
    name: "Sakib Al Hasan",
    email: "sakib@nexora.agency",
    role: "digital_marketer",
    department: "Digital Marketing & Growth Ads",
    title: "Head of Digital Marketing & Paid Ads",
    permissions: ["view_analytics", "manage_requests", "reply_messages"],
    status: "active",
    avatar: "SH",
  },
  {
    name: "Mehedi Hasan Saim",
    email: "saim@nexora.agency",
    role: "developer",
    department: "Python Engineering & Security",
    title: "Python Developer & SecOps Specialist",
    permissions: ["manage_requests", "view_analytics"],
    status: "active",
    avatar: "MS",
  },
  {
    name: "Mehedi",
    email: "mehedi@nexora.agency",
    role: "cyber_security",
    department: "Cyber Security & Threat Defense",
    title: "Cyber Security Analyst",
    permissions: ["manage_requests", "view_analytics"],
    status: "active",
    avatar: "ME",
  },
];

// ─── Team Staff Management Helper ─────────────────────────────────────────────
function mapRoleToStaffCategory(roleStr: string): string {
  const r = (roleStr || "").toLowerCase();
  if (r.includes("founder") || r.includes("cto") || r.includes("superadmin") || r.includes("chief")) {
    return "superadmin";
  }
  if (r.includes("cyber") || r.includes("infrastructure") || r.includes("security")) {
    return "cyber_security";
  }
  if (r.includes("hacker") || r.includes("penetration")) {
    return "ethical_hacker";
  }
  if (r.includes("market") || r.includes("growth") || r.includes("seo")) {
    return "digital_marketer";
  }
  if (r.includes("design") || r.includes("ui") || r.includes("ux") || r.includes("graphics")) {
    return "graphics_designer";
  }
  if (r.includes("developer") || r.includes("engineer") || r.includes("architect") || r.includes("fullstack") || r.includes("backend")) {
    return "developer";
  }
  return "developer";
}

// ─── Team Management ──────────────────────────────────────────────────────────
// GET /api/admin/team — List all team members (synchronized between user collection & TeamMember)
router.get(
  "/team",
  requireAuth,
  requireStaff,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const db = getDb();

      // 1. Ensure TeamMember collection has base entries seeded
      let teamMembers = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
      if (!teamMembers || teamMembers.length === 0) {
        try {
          for (let i = 0; i < teamMembersData.length; i++) {
            const member = teamMembersData[i];
            await TeamMember.findOneAndUpdate(
              { slug: member.slug },
              { ...member, order: i + 1 },
              { upsert: true, new: true }
            );
          }
          teamMembers = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
        } catch (seedErr) {
          console.warn("Could not auto-seed TeamMember collection in /api/admin/team:", seedErr);
        }
      }

      // 2. Fetch staff from both user and users collections
      let staffUsers: any[] = [];
      try {
        const u1 = await db.collection("user").find({ role: { $in: STAFF_ROLES } }).toArray().catch(() => []);
        const u2 = await db.collection("users").find({ role: { $in: STAFF_ROLES } }).toArray().catch(() => []);
        staffUsers = [...u1, ...u2];
      } catch (userErr) {
        console.warn("Could not fetch staff from user collections:", userErr);
      }

      // 3. Build unified combined list
      const combinedMap = new Map<string, any>();

      // A. Populate from TeamMember collection (this has all 7 core team specialists)
      for (const m of teamMembers) {
        const email = (m.socialLinks?.email || `${m.slug}@nexora.agency`).toLowerCase().trim();
        const matchingStaff = staffUsers.find(
          (u) =>
            (u.email || "").toLowerCase().trim() === email ||
            u.name?.toLowerCase().trim() === m.name?.toLowerCase().trim()
        );

        const initials = m.initials || (m.name ? m.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "NX");

        combinedMap.set(email, {
          id: matchingStaff?._id?.toString() || m._id?.toString() || m.slug,
          teamMemberId: m._id?.toString(),
          slug: m.slug,
          name: m.name,
          email,
          role: matchingStaff?.role || m.shortRole || "developer",
          department: m.department || "Computer Science & Technology (CST)",
          title: m.role || "Team Specialist",
          permissions: matchingStaff?.permissions || m.skills || ["manage_requests", "view_analytics"],
          status: matchingStaff?.isBlocked ? "suspended" : (matchingStaff?.status || "active"),
          avatar: m.image || initials,
          createdAt: matchingStaff?.createdAt || m.createdAt || new Date(),
        });
      }

      // B. Merge any additional staff user from user/users collection
      for (const u of staffUsers) {
        const email = (u.email || "").toLowerCase().trim();
        if (email && !combinedMap.has(email)) {
          const initials = u.name
            ? u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
            : "ST";

          combinedMap.set(email, {
            id: u._id?.toString() || `staff_${Date.now()}`,
            teamMemberId: undefined,
            slug: (u.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: u.name,
            email,
            role: u.role || "developer",
            department: u.department || "Nexora Operations & Engineering",
            title: u.title || "Staff Specialist",
            permissions: u.permissions || ["manage_requests", "view_analytics"],
            status: u.isBlocked ? "suspended" : (u.status || "active"),
            avatar: u.avatar || u.image || initials,
            createdAt: u.createdAt || new Date(),
          });
        }
      }

      let data = Array.from(combinedMap.values());

      // C. Safe fallback if still empty
      if (data.length === 0) {
        data = DEFAULT_STAFF.map((s, idx) => ({
          id: `default_${idx}`,
          slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: s.name,
          email: s.email,
          role: s.role,
          department: s.department,
          title: s.title,
          permissions: s.permissions,
          status: s.status,
          avatar: s.avatar,
          createdAt: new Date(),
        }));
      }

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

      const assignedRole = STAFF_ROLES.includes(role) ? role : "developer";
      const assignedPermissions = Array.isArray(permissions) ? permissions : ["manage_requests", "view_analytics"];
      const trimmedEmail = email.toLowerCase().trim();
      const trimmedName = name.trim();

      const cleanSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const initials = trimmedName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      // 1. Create or update in MongoDB "user" collection (for login & RBAC)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await db.collection("user").findOne({ email: trimmedEmail } as any);
      let userId: string;

      if (existing) {
        userId = existing._id.toString();
        // Upgrade existing user to team member
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.collection("user").updateOne(
          { _id: existing._id } as any,
          {
            $set: {
              role: assignedRole,
              department: department || "Computer Science & Technology (CST)",
              title: title || "Staff Specialist",
              permissions: assignedPermissions,
              status: "active",
              isBlocked: false,
            },
          }
        );
      } else {
        userId = "user_" + Date.now();
        await db.collection("user").insertOne({
          _id: userId,
          name: trimmedName,
          email: trimmedEmail,
          role: assignedRole,
          department: department || "Computer Science & Technology (CST)",
          title: title || "Staff Specialist",
          permissions: assignedPermissions,
          status: "active",
          isBlocked: false,
          aiCreditsRemaining: 100,
          createdAt: new Date(),
        } as any);
      }

      // 2. Sync into TeamMember collection (so website /team and homepage instantly show the member)
      try {
        const existingTeamMember = await TeamMember.findOne({
          $or: [
            { "socialLinks.email": trimmedEmail },
            { name: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
          ],
        });

        if (existingTeamMember) {
          existingTeamMember.name = trimmedName;
          existingTeamMember.role = title || assignedRole;
          existingTeamMember.shortRole = assignedRole;
          existingTeamMember.department = department || existingTeamMember.department;
          await existingTeamMember.save();
        } else {
          await TeamMember.create({
            slug: `${cleanSlug}-${Date.now().toString().slice(-4)}`,
            name: trimmedName,
            role: title || assignedRole || "Software Engineer",
            shortRole: assignedRole || "Developer",
            department: department || "Computer Science & Technology (CST)",
            institute: "Nexora Agency",
            location: "Dhaka, Bangladesh",
            tagline: "Specialist delivering next-generation digital platforms at Nexora.",
            bio: `${trimmedName} is an active ${title || assignedRole} on the Nexora engineering and operations team.`,
            fullBio: [`${trimmedName} specializes in delivering high-performance, resilient enterprise systems.`],
            philosophy: "Building resilient and high-velocity digital solutions.",
            initials: initials || "NX",
            image: "",
            gradient: "from-primary-500/20 to-surface-2",
            roleBadgeVariant: "primary",
            stats: [{ label: "Projects Completed", value: "5+" }],
            coreExpertise: [
              {
                title: title || assignedRole,
                description: "Core discipline contributor",
                badge: assignedRole,
                highlightSkills: assignedPermissions,
              },
            ],
            featuredProjects: [],
            skills: assignedPermissions,
            categorizedSkills: [],
            credentials: [],
            socialLinks: { email: trimmedEmail },
            order: (await TeamMember.countDocuments()) + 1,
          });
        }
      } catch (teamSyncErr) {
        console.warn("Could not sync new team member to TeamMember collection:", teamSyncErr);
      }

      res.status(201).json({
        success: true,
        message: `Team member ${trimmedName} added successfully to both admin panel and website!`,
        data: { id: userId, name: trimmedName, email: trimmedEmail, role: assignedRole },
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
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : String(rawId);
      const { role, department, title, permissions, status } = req.body;

      const idFilter = {
        $or: [
          { _id: id },
          ...(mongoose.isValidObjectId(id) ? [{ _id: new mongoose.Types.ObjectId(id) }] : []),
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let user = await db.collection("user").findOne(idFilter as any);
      let targetColl = "user";
      if (!user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user = await db.collection("users").findOne(idFilter as any);
        targetColl = "users";
      }

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
      await db.collection(targetColl).updateOne({ _id: user._id } as any, { $set: updateFields });

      // Update TeamMember collection as well
      try {
        const uEmail = (user.email || "").toLowerCase().trim();
        const teamUpdate: Record<string, unknown> = {};
        if (role) teamUpdate.shortRole = role;
        if (title) teamUpdate.role = title;
        if (department) teamUpdate.department = department;

        if (Object.keys(teamUpdate).length > 0) {
          await TeamMember.updateMany(
            {
              $or: [
                { "socialLinks.email": uEmail },
                { name: { $regex: new RegExp(`^${user.name}$`, "i") } },
              ],
            },
            { $set: teamUpdate }
          );
        }
      } catch (syncErr) {
        console.warn("Could not sync TeamMember update:", syncErr);
      }

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
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : String(rawId);

      const idFilter = {
        $or: [
          { _id: id },
          ...(mongoose.isValidObjectId(id) ? [{ _id: new mongoose.Types.ObjectId(id) }] : []),
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let user = await db.collection("user").findOne(idFilter as any);
      let targetColl = "user";
      if (!user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user = await db.collection("users").findOne(idFilter as any);
        targetColl = "users";
      }

      if (user) {
        // Demote to client/user rather than deleting the account completely
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.collection(targetColl).updateOne(
          { _id: user._id } as any,
          {
            $set: {
              role: "user",
              permissions: [],
              status: "inactive",
            },
          }
        );
      }

      // Remove from TeamMember collection so they disappear from client website
      if (user) {
        const uEmail = (user.email || "").toLowerCase().trim();
        await TeamMember.deleteMany({
          $or: [
            { "socialLinks.email": uEmail },
            { name: { $regex: new RegExp(`^${user.name}$`, "i") } },
          ],
        });
      }

      if (mongoose.isValidObjectId(id)) {
        await TeamMember.findByIdAndDelete(id);
      } else {
        await TeamMember.findOneAndDelete({ slug: id });
      }

      res.json({ success: true, message: "Team member access revoked and removed from website" });
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

