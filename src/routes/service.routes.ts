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

export default router;
