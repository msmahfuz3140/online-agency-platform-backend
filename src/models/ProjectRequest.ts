import mongoose, { Document, Schema, Model } from "mongoose";

export type ProjectStatus =
  | "pending"
  | "reviewing"
  | "in-progress"
  | "review-ready"
  | "completed"
  | "cancelled";

export type BudgetRange =
  | "under-5k"
  | "5k-15k"
  | "15k-50k"
  | "50k-100k"
  | "over-100k"
  | "discuss";

export type TimelineRange =
  | "asap"
  | "1-month"
  | "1-3-months"
  | "3-6-months"
  | "6-plus-months"
  | "flexible";

export interface IDeliverable {
  id: string;
  title: string;
  completed: boolean;
}

export interface ISprintUpdate {
  id: string;
  title: string;
  note: string;
  date: Date;
  postedBy: string;
}

export interface IClientReview {
  rating: number;
  feedback: string;
  approved: boolean;
  submittedAt?: Date;
}

export interface ILeadEngineer {
  name: string;
  role: string;
  avatar: string;
}

export interface IProjectAttachment {
  url: string;
  name: string;
  size?: number;
  format?: string;
  publicId?: string;
}

export interface IProjectRequest extends Document {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  clientId?: string;
  projectTitle: string;
  projectType: string;
  requirements: string;
  techStack?: string[];
  referenceUrls?: string[];
  attachments?: IProjectAttachment[];
  budget: BudgetRange;
  timeline: TimelineRange;
  status: ProjectStatus;
  progress: number;
  leadEngineer?: ILeadEngineer;
  sprintPhase?: string;
  targetLaunch?: string;
  stagingUrl?: string;
  deliverables: IDeliverable[];
  updates: ISprintUpdate[];
  review?: IClientReview;
  adminNotes?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectRequestSchema = new Schema<IProjectRequest>(
  {
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    clientEmail: {
      type: String,
      required: [true, "Client email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    clientPhone: { type: String, trim: true, default: "" },
    clientCompany: { type: String, trim: true, default: "" },
    clientId: { type: String, default: null },
    projectTitle: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      minlength: [3, "Project title must be at least 3 characters"],
      maxlength: [200, "Project title cannot exceed 200 characters"],
    },
    projectType: {
      type: String,
      required: [true, "Project type is required"],
      trim: true,
      enum: [
        "web-app",
        "saas-platform",
        "ai-integration",
        "ecommerce",
        "mobile-app",
        "api-backend",
        "ui-ux-design",
        "other",
      ],
    },
    requirements: {
      type: String,
      required: [true, "Project requirements are required"],
      trim: true,
      minlength: [20, "Requirements must be at least 20 characters"],
      maxlength: [10000, "Requirements cannot exceed 10,000 characters"],
    },
    techStack: { type: [String], default: [] },
    referenceUrls: { type: [String], default: [] },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number },
        format: { type: String },
        publicId: { type: String },
      },
    ],
    budget: {
      type: String,
      required: [true, "Budget range is required"],
      enum: ["under-5k", "5k-15k", "15k-50k", "50k-100k", "over-100k", "discuss"],
    },
    timeline: {
      type: String,
      required: [true, "Timeline is required"],
      enum: ["asap", "1-month", "1-3-months", "3-6-months", "6-plus-months", "flexible"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "reviewing",
        "in-progress",
        "review-ready",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    leadEngineer: {
      name: { type: String, default: "MD Mahfuzul Haque" },
      role: { type: String, default: "Founder & Lead Architect" },
      avatar: { type: String, default: "MH" },
    },
    sprintPhase: {
      type: String,
      default: "Phase 1: Architecture & Scoping",
    },
    targetLaunch: {
      type: String,
      default: "",
    },
    stagingUrl: {
      type: String,
      default: "",
    },
    deliverables: [
      {
        id: { type: String },
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    updates: [
      {
        id: { type: String },
        title: { type: String, required: true },
        note: { type: String, required: true },
        date: { type: Date, default: Date.now },
        postedBy: { type: String, default: "Nexora Team" },
      },
    ],
    review: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String, default: "" },
      approved: { type: Boolean, default: false },
      submittedAt: { type: Date },
    },
    adminNotes: { type: String, trim: true, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

projectRequestSchema.index({ status: 1, createdAt: -1 });
projectRequestSchema.index({ clientEmail: 1 });
projectRequestSchema.index({ clientId: 1 });

export const ProjectRequest: Model<IProjectRequest> =
  mongoose.models.ProjectRequest ||
  mongoose.model<IProjectRequest>("ProjectRequest", projectRequestSchema);

export default ProjectRequest;
