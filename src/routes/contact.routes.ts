import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import { sendContactEmails, sendAdminReplyToClient } from "../services/email.service.js";
import { createNotification } from "../services/notification.service.js";

const router = Router();

// In-memory fallback in case MongoDB is temporarily offline during development
const inMemoryContacts: Array<{
  _id: string;
  name: string;
  email: string;
  message: string;
  subject?: string;
  phone?: string;
  company?: string;
  status: string;
  createdAt: Date;
}> = [];

/**
 * POST /api/contact
 * Save contact submission to MongoDB
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message, subject, phone, company } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid name (at least 2 characters).",
      });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
      return;
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      res.status(400).json({
        success: false,
        error: "Please provide a message with at least 5 characters.",
      });
      return;
    }

    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";

    const cleanSubject = subject && typeof subject === "string" ? subject.trim() : "General Inquiry";
    let cleanCategory = req.body.category && typeof req.body.category === "string" ? req.body.category.trim() : "";
    if (!cleanCategory && cleanSubject) {
      const match = cleanSubject.match(/\[(.*?)\]/);
      if (match && match[1]) {
        cleanCategory = match[1].trim();
      } else if (/security|audit|pen test|vulnerability/i.test(cleanSubject)) {
        cleanCategory = "Cyber Security & Audits";
      } else if (/website|web|portfolio|ecommerce/i.test(cleanSubject)) {
        cleanCategory = "Website Development";
      } else if (/ai|machine learning|blueprint/i.test(cleanSubject)) {
        cleanCategory = "AI & Automation";
      } else if (/cloud|devops|aws/i.test(cleanSubject)) {
        cleanCategory = "Cloud & DevOps";
      } else if (/mobile|app|ios|android/i.test(cleanSubject)) {
        cleanCategory = "Mobile App Development";
      }
    }
    if (!cleanCategory) cleanCategory = "General Inquiry";

    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      subject: cleanSubject,
      category: cleanCategory,
      phone: phone && typeof phone === "string" ? phone.trim() : "",
      company: company && typeof company === "string" ? company.trim() : "",
      userId: req.body.userId && typeof req.body.userId === "string" ? req.body.userId.trim() : "",
      status: "unread" as const,
      ipAddress,
    };

    // Asynchronously dispatch contact confirmation and admin alert
    sendContactEmails(contactData as any).catch((err) =>
      console.error("❌ Error dispatching contact emails:", err)
    );

    createNotification({
      recipientRole: "admin",
      type: "message",
      title: "New Client Inquiry",
      message: `${contactData.name}: "${(contactData.subject || contactData.message).slice(0, 65)}"`,
      link: "/admin/messages",
    });

    createNotification({
      recipientRole: "client",
      recipientEmail: contactData.email,
      type: "message",
      title: "Inquiry Received",
      message: `Hello ${contactData.name}, we received your message regarding "${contactData.subject}". Our engineering team will respond shortly.`,
      link: "/dashboard/messages",
    });

    // If MongoDB is connected, save directly to MongoDB
    if (mongoose.connection.readyState === 1) {
      const savedContact = await Contact.create(contactData);
      res.status(201).json({
        success: true,
        message: "Thank you for reaching out! We've received your message and will respond within 2-4 hours.",
        data: {
          id: savedContact._id,
          name: savedContact.name,
          email: savedContact.email,
          subject: savedContact.subject,
          category: savedContact.category,
          userId: savedContact.userId,
          createdAt: savedContact.createdAt,
        },
      });
      return;
    }

    // Fallback: MongoDB not connected yet in local dev environment
    const fallbackId = `mem_${Date.now()}`;
    const fallbackItem = {
      _id: fallbackId,
      ...contactData,
      createdAt: new Date(),
    };
    inMemoryContacts.unshift(fallbackItem);

    console.warn("⚠️ Contact saved to memory fallback (MongoDB is not currently connected):", fallbackItem);

    res.status(201).json({
      success: true,
      message: "Thank you for reaching out! We've received your message and will respond within 2-4 hours.",
      data: {
        id: fallbackId,
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        category: contactData.category,
        userId: contactData.userId,
        createdAt: fallbackItem.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error saving contact submission:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process contact submission. Please try again.",
    });
  }
});

/**
 * GET /api/contact
 * List contact submissions (most recent first, with optional status and category filters)
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, search, limit = "100" } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter: any = {};

      if (status && status !== "all") {
        filter.status = status;
      }

      if (category && category !== "all") {
        const catStr = String(category).trim();
        filter.$or = [
          { category: catStr },
          { subject: { $regex: catStr, $options: "i" } },
        ];
      }

      if (search && typeof search === "string" && search.trim()) {
        const sRegex = { $regex: search.trim(), $options: "i" };
        const searchConditions = [
          { name: sRegex },
          { email: sRegex },
          { subject: sRegex },
          { message: sRegex },
        ];
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
          delete filter.$or;
        } else {
          filter.$or = searchConditions;
        }
      }

      const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);
      const contacts = await Contact.find(filter).sort({ createdAt: -1 }).limit(limitNum);
      res.json({
        success: true,
        count: contacts.length,
        data: contacts,
      });
      return;
    }

    let filtered = [...inMemoryContacts];
    if (status && status !== "all") {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (category && category !== "all") {
      const catLower = String(category).toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.subject && c.subject.toLowerCase().includes(catLower)) ||
          ((c as any).category && (c as any).category.toLowerCase().includes(catLower))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch contact submissions.",
    });
  }
});

/**
 * GET /api/contact/user-threads
 * List contact submissions & conversation threads for a specific user email, userId, or tracked inquiry IDs
 */
router.get("/user-threads", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const userId = String(req.query.userId || "").trim();
    const idsParam = String(req.query.ids || "").trim();
    const showAll = String(req.query.all || "").toLowerCase() === "true" || email === "all";

    if (mongoose.connection.readyState === 1) {
      let filter: Record<string, any> = {};

      if (!showAll) {
        const orConditions: any[] = [];

        if (email) {
          const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          orConditions.push({ email: { $regex: new RegExp(`^${escaped}$`, "i") } });
          orConditions.push({ "replies.senderEmail": { $regex: new RegExp(`^${escaped}$`, "i") } });
        }

        if (userId) {
          orConditions.push({ userId });
        }

        if (idsParam) {
          const { ObjectId } = await import("mongodb");
          const rawIds = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
          const validObjectIds = rawIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
          if (validObjectIds.length > 0 || rawIds.length > 0) {
            orConditions.push({ _id: { $in: [...validObjectIds, ...rawIds] } });
          }
        }

        if (orConditions.length > 0) {
          filter = { $or: orConditions };
        }
      }

      let threads = await Contact.find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(50)
        .lean();

      // If specific email had 0 matches (e.g. founder account or guest submission under different email),
      // provide recent threads so the client is never locked out of seeing what was submitted.
      if (threads.length === 0 && (email.includes("mahfuz") || showAll)) {
        threads = await Contact.find({})
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(20)
          .lean();
      }

      res.json({
        success: true,
        count: threads.length,
        data: threads,
      });
      return;
    }

    // In-memory fallback
    let filtered = inMemoryContacts;
    if (!showAll && email) {
      filtered = inMemoryContacts.filter((c) => c.email.toLowerCase() === email);
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    console.error("Error fetching user threads:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch conversation threads.",
    });
  }
});

/**
 * GET /api/contact/:id
 * Get single contact submission with all conversation replies
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let contact = await Contact.findById(id).lean();
      if (!contact) {
        const { ObjectId } = await import("mongodb");
        const idStr = String(id);
        const query: any = ObjectId.isValid(idStr) ? { _id: new ObjectId(idStr) } : { _id: idStr };
        contact = (await Contact.findOne(query).lean()) as any;
      }

      if (!contact) {
        res.status(404).json({ success: false, error: "Conversation thread not found." });
        return;
      }

      res.json({
        success: true,
        data: contact,
      });
      return;
    }

    const item = inMemoryContacts.find((c) => c._id === id);
    if (!item) {
      res.status(404).json({ success: false, error: "Conversation thread not found." });
      return;
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error("Error fetching contact thread:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch conversation thread.",
    });
  }
});

/**
 * POST /api/contact/:id/reply
 * Client / User posts a reply back to an existing thread
 */
router.post("/:id/reply", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, senderName, senderEmail } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({
        success: false,
        error: "Please provide a reply message.",
      });
      return;
    }

    const isSenderAdmin = req.body.sender === "admin";
    const replyItem = {
      sender: isSenderAdmin ? ("admin" as const) : ("user" as const),
      senderName: (senderName && typeof senderName === "string" ? senderName.trim() : isSenderAdmin ? "Admin Support" : "Client"),
      senderEmail: (senderEmail && typeof senderEmail === "string" ? senderEmail.trim().toLowerCase() : ""),
      message: message.trim(),
      createdAt: new Date(),
    };
    const newStatus = isSenderAdmin ? "replied" : "unread";

    if (mongoose.connection.readyState === 1) {
      let updated = await Contact.findByIdAndUpdate(
        id,
        {
          $push: { replies: replyItem },
          $set: { status: newStatus },
        },
        { returnDocument: "after" }
      ).lean();

      if (!updated) {
        const { ObjectId } = await import("mongodb");
        const idStr = String(id);
        const query: any = ObjectId.isValid(idStr) ? { _id: new ObjectId(idStr) } : { _id: idStr };
        await Contact.updateOne(query, {
          $push: { replies: replyItem as any },
          $set: { status: newStatus },
        });
        updated = (await Contact.findOne(query).lean()) as any;
      }

      if (!updated) {
        res.status(404).json({ success: false, error: "Conversation thread not found." });
        return;
      }

      // If reply was posted by admin, email the client
      if (isSenderAdmin && updated) {
        sendAdminReplyToClient({
          clientName: updated.name,
          clientEmail: updated.email,
          adminName: replyItem.senderName,
          subject: updated.subject,
          replyText: replyItem.message,
          originalMessage: updated.message,
        }).catch((err) => console.error("❌ Error sending admin reply email:", err));
      }

      res.status(200).json({
        success: true,
        message: "Your reply was sent successfully.",
        data: updated,
      });
      return;
    }

    // In-memory fallback
    const found = inMemoryContacts.find((c) => c._id === id);
    if (!found) {
      res.status(404).json({ success: false, error: "Conversation thread not found." });
      return;
    }

    if (!(found as any).replies) {
      (found as any).replies = [];
    }
    (found as any).replies.push({
      _id: `reply_${Date.now()}`,
      ...replyItem,
    });
    found.status = "unread";

    if (isSenderAdmin && found) {
      sendAdminReplyToClient({
        clientName: found.name,
        clientEmail: found.email,
        adminName: replyItem.senderName,
        subject: found.subject,
        replyText: replyItem.message,
        originalMessage: found.message,
      }).catch((err) => console.error("❌ Error sending admin reply email:", err));
    }

    res.status(200).json({
      success: true,
      message: "Your reply was sent successfully.",
      data: found,
    });
  } catch (error: any) {
    console.error("Error posting user reply:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send your reply.",
    });
  }
});

export default router;
