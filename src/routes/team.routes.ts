import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import TeamMember from "../models/TeamMember.js";
import { teamMembersData } from "../data/team.data.js";

const router = Router();

const STAFF_ROLES = [
  "superadmin",
  "admin",
  "manager",
  "support",
  "developer",
  "editor",
  "cyber_security",
  "ethical_hacker",
  "digital_marketer",
  "graphics_designer",
];

/**
 * GET /api/team
 * Fetches all team members sorted by leadership order
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    let members = await TeamMember.find().sort({ order: 1, createdAt: 1 });

    // Seed default team members if collection is empty
    if (!members || members.length === 0) {
      try {
        for (let i = 0; i < teamMembersData.length; i++) {
          const member = teamMembersData[i];
          await TeamMember.findOneAndUpdate(
            { slug: member.slug },
            { ...member, order: i + 1 },
            { upsert: true, new: true }
          );
        }
        members = await TeamMember.find().sort({ order: 1, createdAt: 1 });
      } catch (seedErr) {
        console.warn("Could not seed team members:", seedErr);
      }
    }

    // Auto-sync any staff users from the user collection into TeamMember
    // (Guarantees that members added via the admin panel immediately appear on the client website)
    try {
      const db = mongoose.connection.db;
      if (db) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const staffUsers1 = await db
          .collection("user")
          .find({ role: { $in: STAFF_ROLES } } as any)
          .toArray()
          .catch(() => []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const staffUsers2 = await db
          .collection("users")
          .find({ role: { $in: STAFF_ROLES } } as any)
          .toArray()
          .catch(() => []);
        const staffUsers = [...staffUsers1, ...staffUsers2];

        let updated = false;
        for (const u of staffUsers) {
          const uEmail = (u.email || "").toLowerCase().trim();
          const exists = members.some(
            (m) =>
              (m.socialLinks?.email || "").toLowerCase() === uEmail ||
              m.name?.toLowerCase().trim() === u.name?.toLowerCase().trim()
          );

          if (!exists && u.name) {
            const cleanSlug = u.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const initials = u.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            await TeamMember.create({
              slug: `${cleanSlug}-${Date.now().toString().slice(-4)}`,
              name: u.name,
              role: u.title || u.role || "Team Specialist",
              shortRole: u.role || "Developer",
              department: u.department || "Computer Science & Technology (CST)",
              institute: "Nexora Agency",
              location: "Dhaka, Bangladesh",
              tagline: "Specialist delivering next-generation digital platforms at Nexora.",
              bio: `${u.name} is an active ${u.title || u.role} on the Nexora engineering and operations team.`,
              fullBio: [`${u.name} specializes in delivering high-performance, resilient enterprise systems.`],
              philosophy: "Building resilient and high-velocity digital solutions.",
              initials: initials || "NX",
              image: u.avatar || "",
              gradient: "from-primary-500/20 to-surface-2",
              roleBadgeVariant: "primary",
              stats: [{ label: "Projects Completed", value: "5+" }],
              coreExpertise: [
                {
                  title: u.title || u.role || "Engineering",
                  description: "Core discipline contributor",
                  badge: u.role || "Developer",
                  highlightSkills: u.permissions || [],
                },
              ],
              featuredProjects: [],
              skills: u.permissions || [],
              categorizedSkills: [],
              credentials: [],
              socialLinks: { email: uEmail },
              order: (await TeamMember.countDocuments()) + 1,
            });
            updated = true;
          }
        }

        if (updated) {
          members = await TeamMember.find().sort({ order: 1, createdAt: 1 });
        }
      }
    } catch (syncErr) {
      console.warn("Staff sync check warning in /api/team:", syncErr);
    }

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
 * Fetches single team member profile by slug or ID
 */
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    let member = await TeamMember.findOne({ slug });

    if (!member && mongoose.isValidObjectId(slug)) {
      member = await TeamMember.findById(slug);
    }

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
