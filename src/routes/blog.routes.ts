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

export default router;
