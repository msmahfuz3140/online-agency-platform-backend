import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import ProjectRequest from "../models/ProjectRequest.js";
import { sendProjectRequestEmails } from "../services/email.service.js";

const router = Router();

// In-memory fallback for dev without MongoDB
const inMemoryRequests: Array<Record<string, unknown>> = [];

/**
 * POST /api/project-request
 * Submit a new project request
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      clientId,
      projectTitle,
      projectType,
      requirements,
      techStack,
      referenceUrls,
      budget,
      timeline,
    } = req.body;

    // --- Validation ---
    if (!clientName || typeof clientName !== "string" || clientName.trim().length < 2) {
      res.status(400).json({ success: false, error: "Please provide a valid name (at least 2 characters)." });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!clientEmail || !emailRegex.test(clientEmail.trim())) {
      res.status(400).json({ success: false, error: "Please provide a valid email address." });
      return;
    }

    if (!projectTitle || typeof projectTitle !== "string" || projectTitle.trim().length < 3) {
      res.status(400).json({ success: false, error: "Please provide a project title (at least 3 characters)." });
      return;
    }

    const validTypes = ["web-app","saas-platform","ai-integration","ecommerce","mobile-app","api-backend","ui-ux-design","other"];
    if (!projectType || !validTypes.includes(projectType)) {
      res.status(400).json({ success: false, error: "Please select a valid project type." });
      return;
    }

    if (!requirements || typeof requirements !== "string" || requirements.trim().length < 20) {
      res.status(400).json({ success: false, error: "Please describe your requirements (at least 20 characters)." });
      return;
    }

    const validBudgets = ["under-5k","5k-15k","15k-50k","50k-100k","over-100k","discuss"];
    if (!budget || !validBudgets.includes(budget)) {
      res.status(400).json({ success: false, error: "Please select a valid budget range." });
      return;
    }

    const validTimelines = ["asap","1-month","1-3-months","3-6-months","6-plus-months","flexible"];
    if (!timeline || !validTimelines.includes(timeline)) {
      res.status(400).json({ success: false, error: "Please select a valid timeline." });
      return;
    }

    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";

    const requestData = {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone: clientPhone?.trim() || "",
      clientCompany: clientCompany?.trim() || "",
      clientId: clientId || null,
      projectTitle: projectTitle.trim(),
      projectType,
      requirements: requirements.trim(),
      techStack: Array.isArray(techStack) ? techStack.map((t: string) => t.trim()).filter(Boolean) : [],
      referenceUrls: Array.isArray(referenceUrls) ? referenceUrls.map((u: string) => u.trim()).filter(Boolean) : [],
      budget,
      timeline,
      status: "pending" as const,
      progress: 0,
      leadEngineer: {
        name: "MD Mahfuzul Haque",
        role: "Founder & Lead Architect",
        avatar: "MH",
      },
      sprintPhase: "Phase 1: Requirements Scoping & Architecture",
      targetLaunch: "Within 2-4 Weeks",
      stagingUrl: "",
      deliverables: [
        {
          id: `del_${Date.now()}_1`,
          title: "Project Scope & Architecture Blueprint",
          completed: true,
        },
        {
          id: `del_${Date.now()}_2`,
          title: "UI/UX Components & Responsive Layouts",
          completed: false,
        },
        {
          id: `del_${Date.now()}_3`,
          title: "Core Business Logic & Backend Integration",
          completed: false,
        },
        {
          id: `del_${Date.now()}_4`,
          title: "Staging Deployment & Production QA Audit",
          completed: false,
        },
      ],
      updates: [
        {
          id: `upd_${Date.now()}_1`,
          title: "Inquiry Received & Logged",
          note: "Your project specifications have been submitted to MD Mahfuzul Haque and the engineering team.",
          date: new Date(),
          postedBy: "Nexora System",
        },
      ],
      ipAddress,
    };

    // Asynchronously dispatch transactional emails (non-blocking)
    sendProjectRequestEmails(requestData as any).catch((err) =>
      console.error("❌ Error dispatching project request emails:", err)
    );

    if (mongoose.connection.readyState === 1) {
      const saved = await ProjectRequest.create(requestData);
      res.status(201).json({
        success: true,
        message: "Your project request has been received! Our team will review it and get back to you within 24 hours.",
        data: {
          id: saved._id,
          _id: saved._id,
          projectTitle: saved.projectTitle,
          status: saved.status,
          createdAt: saved.createdAt,
        },
      });
      return;
    }

    // Fallback: in-memory
    const fallbackId = `mem_${Date.now()}`;
    const fallbackItem = { _id: fallbackId, ...requestData, createdAt: new Date() };
    inMemoryRequests.unshift(fallbackItem);
    console.warn("⚠️ Project request saved to memory fallback (MongoDB not connected):", fallbackItem._id);

    res.status(201).json({
      success: true,
      message: "Your project request has been received! Our team will review it and get back to you within 24 hours.",
      data: {
        id: fallbackId,
        _id: fallbackId,
        projectTitle: requestData.projectTitle,
        status: requestData.status,
        createdAt: fallbackItem.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error saving project request:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to submit project request. Please try again.",
    });
  }
});

/**
 * GET /api/project-request/my-requests
 * Fetch project requests for a specific client (by email, userId, or tracked IDs)
 */
router.get("/my-requests", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, userId, ids, all } = req.query;

    if (all === "true") {
      if (mongoose.connection.readyState === 1) {
        const allList = await ProjectRequest.find().sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, count: allList.length, data: allList });
        return;
      }
      res.json({ success: true, count: inMemoryRequests.length, data: inMemoryRequests });
      return;
    }

    const orConditions: any[] = [];
    if (email && typeof email === "string" && email.trim()) {
      orConditions.push({ clientEmail: email.trim().toLowerCase() });
    }
    if (userId && typeof userId === "string" && userId.trim()) {
      orConditions.push({ clientId: userId.trim() });
    }
    if (ids && typeof ids === "string" && ids.trim()) {
      const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
      const validObjIds = idList.filter((id) => mongoose.isValidObjectId(id));
      if (validObjIds.length > 0) {
        orConditions.push({ _id: { $in: validObjIds } });
      }
    }

    if (orConditions.length === 0) {
      // Fallback: return most recent requests so user is never empty in dev
      if (mongoose.connection.readyState === 1) {
        const recent = await ProjectRequest.find().sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, count: recent.length, data: recent });
        return;
      }
      res.json({ success: true, count: inMemoryRequests.length, data: inMemoryRequests.slice(0, 10) });
      return;
    }

    if (mongoose.connection.readyState === 1) {
      const matched = await ProjectRequest.find({ $or: orConditions }).sort({ createdAt: -1 });
      res.json({ success: true, count: matched.length, data: matched });
      return;
    }

    // In-memory fallback
    const matchedMem = inMemoryRequests.filter((r: any) => {
      if (email && r.clientEmail === String(email).toLowerCase()) return true;
      if (userId && r.clientId === String(userId)) return true;
      return false;
    });

    res.json({
      success: true,
      count: matchedMem.length,
      data: matchedMem.length > 0 ? matchedMem : inMemoryRequests.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Error fetching client project requests:", error);
    res.status(500).json({ success: false, error: "Failed to fetch project requests." });
  }
});

/**
 * POST /api/project-request/:id/review
 * Client submits review, rating (1-5), feedback, and approval
 */
router.post("/:id/review", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, feedback, approved } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      res.status(400).json({ success: false, error: "Please provide a valid rating between 1 and 5." });
      return;
    }

    const reviewData = {
      rating: numRating,
      feedback: typeof feedback === "string" ? feedback.trim() : "",
      approved: Boolean(approved),
      submittedAt: new Date(),
    };

    const updatePayload: any = {
      review: reviewData,
    };

    // If client approves, transition to completed
    if (approved) {
      updatePayload.status = "completed";
      updatePayload.progress = 100;
    }

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      const updated = await ProjectRequest.findByIdAndUpdate(
        id,
        {
          $set: updatePayload,
          $push: {
            updates: {
              id: `upd_${Date.now()}`,
              title: approved ? "Client Approved Deliverables" : "Client Review Submitted",
              note: `Client submitted a ${numRating}★ review${feedback ? `: "${feedback.slice(0, 80)}..."` : "."}`,
              date: new Date(),
              postedBy: "Client QA",
            },
          },
        },
        { new: true }
      );

      if (!updated) {
        res.status(404).json({ success: false, error: "Project request not found." });
        return;
      }

      res.json({ success: true, message: "Thank you! Your review has been recorded.", data: updated });
      return;
    }

    // Fallback: in-memory
    const idx = inMemoryRequests.findIndex((r: any) => r._id === id || String(r._id) === id);
    if (idx !== -1) {
      inMemoryRequests[idx] = {
        ...inMemoryRequests[idx],
        ...updatePayload,
      };
      res.json({ success: true, message: "Review recorded (memory).", data: inMemoryRequests[idx] });
      return;
    }

    res.status(404).json({ success: false, error: "Project request not found." });
  } catch (error: any) {
    console.error("Error submitting client review:", error);
    res.status(500).json({ success: false, error: "Failed to submit review." });
  }
});

/**
 * GET /api/project-request
 * List project requests (admin use) — most recent first
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      const requests = await ProjectRequest.find()
        .sort({ createdAt: -1 })
        .limit(100);
      res.json({ success: true, count: requests.length, data: requests });
      return;
    }

    res.json({ success: true, count: inMemoryRequests.length, data: inMemoryRequests });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch project requests.",
    });
  }
});

/**
 * PATCH /api/project-request/:id/status
 * Update request status (admin)
 */
router.patch("/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = [
      "pending",
      "reviewing",
      "in-progress",
      "review-ready",
      "completed",
      "cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: "Invalid status value." });
      return;
    }

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      const updated = await ProjectRequest.findByIdAndUpdate(
        id,
        { status, ...(adminNotes !== undefined && { adminNotes }) },
        { new: true, runValidators: true }
      );
      if (!updated) {
        res.status(404).json({ success: false, error: "Project request not found." });
        return;
      }
      res.json({ success: true, data: updated });
      return;
    }

    const idx = inMemoryRequests.findIndex((r) => r._id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: "Project request not found." });
      return;
    }
    inMemoryRequests[idx] = { ...inMemoryRequests[idx], status };
    res.json({ success: true, data: inMemoryRequests[idx] });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update project request status.",
    });
  }
});

export default router;
