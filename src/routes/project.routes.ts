import { Router, Request, Response } from "express";
import Project from "../models/Project.js";
import { projectsData } from "../data/projects.data.js";

const router = Router();

/**
 * GET /api/portfolio
 * Optional query: ?category=SaaS+%26+Web+App
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter: Record<string, any> = {};

    if (category && typeof category === "string" && category !== "All") {
      filter.category = category;
    }

    const projects = await Project.find(filter).sort({ order: 1, createdAt: 1 });

    if (!projects || projects.length === 0) {
      const filtered =
        category && category !== "All"
          ? projectsData.filter((p) => p.category === category)
          : projectsData;
      return res.status(200).json({ success: true, count: filtered.length, data: filtered });
    }

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return res.status(200).json({
      success: true,
      count: projectsData.length,
      data: projectsData,
      fromFallback: true,
    });
  }
});

/**
 * GET /api/portfolio/:id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ id });

    if (!project) {
      const fallback = projectsData.find((p) => p.id === id);
      if (fallback) {
        return res.status(200).json({ success: true, data: fallback });
      }
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error("Error fetching project by id:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/portfolio — Create new portfolio project (Staff only)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.id || !data.title) {
      return res.status(400).json({ success: false, message: "Project id and title are required" });
    }
    const created = await Project.create(data);
    return res.status(201).json({ success: true, data: created, message: "Project created successfully" });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create project" });
  }
});

/**
 * PUT /api/portfolio/:id — Update portfolio project (Staff only)
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Project.findOneAndUpdate({ id }, { $set: req.body }, { new: true, upsert: true });
    return res.status(200).json({ success: true, data: updated, message: "Project updated successfully" });
  } catch (error: any) {
    console.error("Error updating project:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update project" });
  }
});

/**
 * DELETE /api/portfolio/:id — Delete portfolio project (Staff only)
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Project.findOneAndDelete({ id });
    return res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete project" });
  }
});

export default router;
