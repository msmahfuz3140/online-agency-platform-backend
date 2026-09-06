import mongoose from "mongoose";
import Notification, { INotification } from "../models/Notification.js";
import ProjectRequest from "../models/ProjectRequest.js";
import Contact from "../models/Contact.js";
import { getMongoClient } from "../config/db.js";

const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";

// In-memory fallback
const inMemoryNotifications: Array<Record<string, any>> = [];

export async function createNotification(data: {
  recipientRole: "admin" | "client";
  recipientEmail?: string;
  recipientId?: string;
  type: "project_request" | "project_review" | "sprint_update" | "message" | "reply" | "user_register";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const doc = {
      ...data,
      recipientEmail: data.recipientEmail ? data.recipientEmail.trim().toLowerCase() : "",
      read: false,
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      await Notification.create(doc);
      return;
    }

    // In-memory fallback
    inMemoryNotifications.unshift({
      _id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...doc,
    });
  } catch (err) {
    console.error("❌ Failed to create notification:", err);
  }
}

/**
 * Ensures admin has real notifications seeded from existing database history if empty
 */
async function ensureAdminNotificationsSeeded(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;

  const count = await Notification.countDocuments({ recipientRole: "admin" });
  if (count > 0) return;

  try {
    const toInsert: any[] = [];

    // 1. Seed latest Project Requests
    const reqs = await ProjectRequest.find().sort({ createdAt: -1 }).limit(10);
    for (const r of reqs) {
      toInsert.push({
        recipientRole: "admin",
        type: r.status === "completed" ? "project_review" : "project_request",
        title: r.status === "completed" ? "Client Approved Deliverables" : "New Project Brief",
        message: `${r.clientName} submitted brief for "${r.projectTitle}" [${r.budget || "Discuss"}]`,
        link: "/admin/requests",
        read: false,
        createdAt: r.createdAt || new Date(),
      });
    }

    // 2. Seed latest Contact messages
    const msgs = await Contact.find().sort({ createdAt: -1 }).limit(10);
    for (const m of msgs) {
      toInsert.push({
        recipientRole: "admin",
        type: "message",
        title: "New Client Inquiry",
        message: `${m.name}: "${(m.subject || m.category || m.message).slice(0, 70)}"`,
        link: "/admin/messages",
        read: m.status === "read" || m.status === "replied",
        createdAt: m.createdAt || new Date(),
      });
    }

    // 3. Seed latest Users
    try {
      const client = getMongoClient();
      const db = client.db(DB_NAME);
      const users = await db.collection("user").find().sort({ createdAt: -1 }).limit(5).toArray();
      for (const u of users) {
        toInsert.push({
          recipientRole: "admin",
          type: "user_register",
          title: "New Member Registered",
          message: `${u.name || "User"} (${u.email}) created an account.`,
          link: "/admin/users",
          read: false,
          createdAt: u.createdAt || new Date(),
        });
      }
    } catch {}

    if (toInsert.length > 0) {
      toInsert.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      await Notification.insertMany(toInsert);
    }
  } catch (err) {
    console.warn("Notice: could not auto-seed admin notifications:", err);
  }
}

/**
 * Ensures client has real notifications seeded from their project requests if empty
 */
async function ensureClientNotificationsSeeded(cleanEmail: string): Promise<void> {
  if (mongoose.connection.readyState !== 1 || !cleanEmail) return;

  const count = await Notification.countDocuments({
    recipientRole: "client",
    recipientEmail: cleanEmail,
  });
  if (count > 0) return;

  try {
    const toInsert: any[] = [];
    const clientProjects = await ProjectRequest.find({ clientEmail: cleanEmail })
      .sort({ createdAt: -1 })
      .limit(10);

    for (const p of clientProjects) {
      // 1. Initial Brief received
      toInsert.push({
        recipientRole: "client",
        recipientEmail: cleanEmail,
        type: "project_request",
        title: "Project Brief Logged",
        message: `Your specifications for "${p.projectTitle}" are logged with Nexora engineering.`,
        link: "/dashboard?tab=projects",
        read: false,
        createdAt: p.createdAt || new Date(),
      });

      // 2. If status updated or milestone completed
      if (p.status === "completed") {
        toInsert.push({
          recipientRole: "client",
          recipientEmail: cleanEmail,
          type: "sprint_update",
          title: "Project Deployed Live 🚀",
          message: `Congratulations! "${p.projectTitle}" has reached 100% completion & signed off.`,
          link: "/dashboard?tab=projects",
          read: false,
          createdAt: p.updatedAt || new Date(),
        });
      } else if (p.status === "review-ready") {
        toInsert.push({
          recipientRole: "client",
          recipientEmail: cleanEmail,
          type: "sprint_update",
          title: "Deliverables Ready for Review ⭐",
          message: `Staging preview ready for "${p.projectTitle}". Inspect deliverables & approve.`,
          link: "/dashboard?tab=projects",
          read: false,
          createdAt: p.updatedAt || new Date(),
        });
      } else if (p.progress > 0) {
        toInsert.push({
          recipientRole: "client",
          recipientEmail: cleanEmail,
          type: "sprint_update",
          title: `Sprint Progress: ${p.progress}%`,
          message: `Active phase: ${p.sprintPhase || "Engineering in progress"}.`,
          link: "/dashboard?tab=projects",
          read: false,
          createdAt: p.updatedAt || new Date(),
        });
      }
    }

    if (toInsert.length > 0) {
      toInsert.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      await Notification.insertMany(toInsert);
    }
  } catch (err) {
    console.warn("Notice: could not auto-seed client notifications:", err);
  }
}

export async function getAdminNotifications(): Promise<{
  notifications: any[];
  unreadCount: number;
}> {
  if (mongoose.connection.readyState === 1) {
    await ensureAdminNotificationsSeeded();
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientRole: "admin" })
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
      Notification.countDocuments({ recipientRole: "admin", read: false }),
    ]);

    return { notifications, unreadCount };
  }

  const mem = inMemoryNotifications.filter((n) => n.recipientRole === "admin");
  const unreadCount = mem.filter((n) => !n.read).length;
  return { notifications: mem.slice(0, 40), unreadCount };
}

export async function getClientNotifications(email: string): Promise<{
  notifications: any[];
  unreadCount: number;
}> {
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    if (cleanEmail) {
      await ensureClientNotificationsSeeded(cleanEmail);
    }

    const filter: Record<string, any> = {
      recipientRole: "client",
    };
    if (cleanEmail) {
      filter.recipientEmail = cleanEmail;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(40).lean(),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    return { notifications, unreadCount };
  }

  const mem = inMemoryNotifications.filter(
    (n) => n.recipientRole === "client" && (!cleanEmail || n.recipientEmail === cleanEmail)
  );
  const unreadCount = mem.filter((n) => !n.read).length;
  return { notifications: mem.slice(0, 40), unreadCount };
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
    const res = await Notification.findByIdAndUpdate(id, { read: true });
    return Boolean(res);
  }

  const item = inMemoryNotifications.find((n) => n._id === id);
  if (item) {
    item.read = true;
    return true;
  }
  return false;
}

export async function markAllNotificationsAsRead(role: "admin" | "client", email?: string): Promise<void> {
  const filter: Record<string, any> = { recipientRole: role };
  if (role === "client" && email) {
    filter.recipientEmail = email.trim().toLowerCase();
  }

  if (mongoose.connection.readyState === 1) {
    await Notification.updateMany(filter, { $set: { read: true } });
    return;
  }

  inMemoryNotifications.forEach((n) => {
    if (n.recipientRole === role) {
      if (role === "client" && email && n.recipientEmail !== email.trim().toLowerCase()) return;
      n.read = true;
    }
  });
}
