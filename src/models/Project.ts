import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  id: string;
  title: string;
  tagline: string;
  category: string;
  description: string;
  features: string[];
  tech: string[];
  liveUrl: string;
  githubUrl: string;
  gradient: string;
  accentColor: string;
  icon: string;
  year: string;
  badge?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema<IProject>(
  {
    id: {
      type: String,
      required: [true, "Project id/slug is required"],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Project category is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    tech: {
      type: [String],
      default: [],
    },
    liveUrl: {
      type: String,
      default: "#",
      trim: true,
    },
    githubUrl: {
      type: String,
      default: "#",
      trim: true,
    },
    gradient: {
      type: String,
      default: "from-primary-500/25 via-primary-500/10 to-transparent",
    },
    accentColor: {
      type: String,
      default: "text-primary-400",
    },
    icon: {
      type: String,
      default: "💻",
    },
    year: {
      type: String,
      default: "2025",
    },
    badge: {
      type: String,
      required: false,
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

export const Project =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
