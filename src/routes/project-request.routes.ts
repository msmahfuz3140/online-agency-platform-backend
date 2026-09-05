import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import ProjectRequest from "../models/ProjectRequest.js";

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
      ipAddress,
    };

    if (mongoose.connection.readyState === 1) {
      const saved = await ProjectRequest.create(requestData);
      res.status(201).json({
        success: true,
        message: "Your project request has been received! Our team will review it and get back to you within 24 hours.",
        data: {
          id: saved._id,
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
 * GET /api/project-request
 * List project requests (admin use) — most recent first
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      const requests = await ProjectRequest.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .select("-adminNotes -ipAddress");
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

    const validStatuses = ["pending","in-progress","completed","cancelled"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: "Invalid status value." });
      return;
    }

    if (mongoose.connection.readyState === 1) {
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
