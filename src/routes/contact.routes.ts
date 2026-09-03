import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";

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

    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      subject: subject && typeof subject === "string" ? subject.trim() : "General Inquiry",
      phone: phone && typeof phone === "string" ? phone.trim() : "",
      company: company && typeof company === "string" ? company.trim() : "",
      status: "unread" as const,
      ipAddress,
    };

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
 * List contact submissions (most recent first)
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      const contacts = await Contact.find().sort({ createdAt: -1 }).limit(50);
      res.json({
        success: true,
        count: contacts.length,
        data: contacts,
      });
      return;
    }

    res.json({
      success: true,
      count: inMemoryContacts.length,
      data: inMemoryContacts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch contact submissions.",
    });
  }
});

export default router;
