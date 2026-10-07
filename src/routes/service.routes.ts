import { Router, Request, Response } from "express";
import Service from "../models/Service.js";
import { servicesData } from "../data/services.data.js";

const router = Router();

/**
 * GET /api/services
 * Optional query: ?category=Website+Development
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter: Record<string, any> = {};

    if (category && typeof category === "string" && category !== "All") {
      filter.category = category;
    }

    const services = await Service.find(filter).sort({ order: 1, createdAt: 1 });

    // Resilient fallback if DB hasn't been seeded yet
    if (!services || services.length === 0) {
      const filtered =
        category && category !== "All"
          ? servicesData.filter((s) => s.category === category)
          : servicesData;
      return res.status(200).json({ success: true, count: filtered.length, data: filtered });
    }

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    // Return fallback data on database error
    return res.status(200).json({
      success: true,
      count: servicesData.length,
      data: servicesData,
      fromFallback: true,
    });
  }
});

/**
 * GET /api/services/:id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findOne({ id });

    if (!service) {
      const fallback = servicesData.find((s) => s.id === id);
      if (fallback) {
        return res.status(200).json({ success: true, data: fallback });
      }
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    return res.status(200).json({ success: true, data: service });
  } catch (error: any) {
    console.error("Error fetching service by id:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/services — Create a new service (Staff only)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.id || !data.title) {
      return res.status(400).json({ success: false, message: "Service id and title are required" });
    }
    const created = await Service.create(data);
    return res.status(201).json({ success: true, data: created, message: "Service created successfully" });
  } catch (error: any) {
    console.error("Error creating service:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create service" });
  }
});

/**
 * PUT /api/services/:id — Update service (Staff only)
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Service.findOneAndUpdate({ id }, { $set: req.body }, { new: true, upsert: true });
    return res.status(200).json({ success: true, data: updated, message: "Service updated successfully" });
  } catch (error: any) {
    console.error("Error updating service:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update service" });
  }
});

/**
 * DELETE /api/services/:id — Delete service (Staff only)
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Service.findOneAndDelete({ id });
    return res.status(200).json({ success: true, message: "Service deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete service" });
  }
});

export default router;
