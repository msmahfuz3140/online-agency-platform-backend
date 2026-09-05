import mongoose, { Schema, Document } from "mongoose";

export interface ITeamMember extends Document {
  slug: string;
  name: string;
  role: string;
  shortRole: string;
  department: string;
  institute: string;
  location: string;
  tagline: string;
  bio: string;
  fullBio: string[];
  philosophy: string;
  initials: string;
  image?: string;
  gradient: string;
  roleBadgeVariant: "primary" | "warning" | "success" | "default";
  stats: { label: string; value: string }[];
  coreExpertise: {
    title: string;
    description: string;
    badge: string;
    highlightSkills: string[];
  }[];
  featuredProjects: {
    title: string;
    role: string;
    description: string;
    metrics: string;
    tech: string[];
  }[];
  skills: string[];
  categorizedSkills: {
    category: string;
    items: string[];
  }[];
  credentials: {
    degree: string;
    institution: string;
    period: string;
    description: string;
    type: "degree" | "certification";
  }[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
    portfolio?: string;
  };
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema: Schema = new Schema<ITeamMember>(
  {
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    shortRole: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    institute: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
    },
    fullBio: {
      type: [String],
      default: [],
    },
    philosophy: {
      type: String,
      default: "",
    },
    initials: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    gradient: {
      type: String,
      default: "from-primary-500/20 to-surface-2",
    },
    roleBadgeVariant: {
      type: String,
      enum: ["primary", "warning", "success", "default"],
      default: "primary",
    },
    stats: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    coreExpertise: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        badge: { type: String, required: true },
        highlightSkills: { type: [String], default: [] },
      },
    ],
    featuredProjects: [
      {
        title: { type: String, required: true },
        role: { type: String, required: true },
        description: { type: String, required: true },
        metrics: { type: String, required: true },
        tech: { type: [String], default: [] },
      },
    ],
    skills: {
      type: [String],
      default: [],
    },
    categorizedSkills: [
      {
        category: { type: String, required: true },
        items: { type: [String], default: [] },
      },
    ],
    credentials: [
      {
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        period: { type: String, required: true },
        description: { type: String, default: "" },
        type: { type: String, enum: ["degree", "certification"], default: "degree" },
      },
    ],
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      email: { type: String, default: "" },
      portfolio: { type: String, default: "" },
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

export const TeamMember =
  mongoose.models.TeamMember ||
  mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);

export default TeamMember;
