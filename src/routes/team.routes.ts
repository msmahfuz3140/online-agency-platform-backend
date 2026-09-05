import { Router, Request, Response } from "express";
import TeamMember from "../models/TeamMember.js";
import { teamMembersData } from "../data/team.data.js";

const router = Router();

/**
 * GET /api/team
 * Fetches all team members sorted by leadership order
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const members = await TeamMember.find().sort({ order: 1, createdAt: 1 });

    if (!members || members.length === 0) {
      return res.status(200).json({
        success: true,
        count: teamMembersData.length,
        data: teamMembersData,
        fromFallback: true,
      });
    }

    return res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return res.status(200).json({
      success: true,
      count: teamMembersData.length,
      data: teamMembersData,
      fromFallback: true,
    });
  }
});

/**
 * GET /api/team/:slug
 * Fetches single team member profile by slug
 */
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const member = await TeamMember.findOne({ slug });

    if (!member) {
      const fallback = teamMembersData.find((m) => m.slug === slug);
      if (fallback) {
        return res.status(200).json({ success: true, data: fallback });
      }
      return res.status(404).json({ success: false, message: "Team member not found" });
    }

    return res.status(200).json({ success: true, data: member });
  } catch (error: any) {
    console.error("Error fetching team member by slug:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
