import mongoose, { Schema, Document } from "mongoose";

export interface IBlogPost extends Document {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    role: string;
    initials: string;
  };
  category: string;
  tags: string[];
  readingTime: string;
  publishedAt: string;
  coverGradient: string;
  coverIcon: string;
  featured?: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema<IBlogPost>(
  {
    slug: {
      type: String,
      required: [true, "Blog slug is required"],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      name: { type: String, required: true },
      role: { type: String, required: true },
      initials: { type: String, required: true },
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    readingTime: {
      type: String,
      default: "5 min read",
    },
    publishedAt: {
      type: String,
      required: true,
    },
    coverGradient: {
      type: String,
      default: "from-primary-500/20 via-primary-500/5 to-transparent",
    },
    coverIcon: {
      type: String,
      default: "📝",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const BlogPost =
  mongoose.models.BlogPost ||
  mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
