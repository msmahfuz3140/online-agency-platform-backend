import { Router, Request, Response } from "express";
import BlogPost from "../models/BlogPost.js";
import { blogPosts } from "../data/blog.data.js";

const router = Router();

/**
 * GET /api/blog
 * Optional queries: ?category=... & ?tag=...
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, tag } = req.query;
    const filter: Record<string, any> = {};

    if (category && typeof category === "string" && category !== "All") {
      filter.category = category;
    }

    if (tag && typeof tag === "string") {
      filter.tags = tag;
    }

    const posts = await BlogPost.find(filter).sort({ order: 1, createdAt: -1 });

    if (!posts || posts.length === 0) {
      let filtered = blogPosts;
      if (category && category !== "All") {
        filtered = filtered.filter((p) => p.category === category);
      }
      if (tag) {
        filtered = filtered.filter((p) => p.tags.includes(tag as string));
      }
      return res.status(200).json({ success: true, count: filtered.length, data: filtered });
    }

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error: any) {
    console.error("Error fetching blog posts:", error);
    return res.status(200).json({
      success: true,
      count: blogPosts.length,
      data: blogPosts,
      fromFallback: true,
    });
  }
});

/**
 * GET /api/blog/:slug
 */
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findOne({ slug });

    if (!post) {
      const fallback = blogPosts.find((p) => p.slug === slug);
      if (fallback) {
        return res.status(200).json({ success: true, data: fallback });
      }
      return res.status(404).json({ success: false, message: "Blog post not found" });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error: any) {
    console.error("Error fetching blog post by slug:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/blog — Create new blog article (Staff only)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.slug || !data.title) {
      return res.status(400).json({ success: false, message: "Blog post slug and title are required" });
    }
    const created = await BlogPost.create(data);
    return res.status(201).json({ success: true, data: created, message: "Blog post created successfully" });
  } catch (error: any) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create blog post" });
  }
});

/**
 * PUT /api/blog/:slug — Update blog article (Staff only)
 */
router.put("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const updated = await BlogPost.findOneAndUpdate({ slug }, { $set: req.body }, { new: true, upsert: true });
    return res.status(200).json({ success: true, data: updated, message: "Blog post updated successfully" });
  } catch (error: any) {
    console.error("Error updating blog post:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update blog post" });
  }
});

/**
 * DELETE /api/blog/:slug — Delete blog article (Staff only)
 */
router.delete("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    await BlogPost.findOneAndDelete({ slug });
    return res.status(200).json({ success: true, message: "Blog post deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting blog post:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete blog post" });
  }
});

export default router;
