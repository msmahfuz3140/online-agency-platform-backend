import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  id: string;
  title: string;
  category: string;
  timeline: string;
  icon: string;
  tagline: string;
  description: string;
  deliverables: string[];
  techStack: string[];
  highlight?: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema<IService>(
  {
    id: {
      type: String,
      required: [true, "Service id/slug is required"],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Service category is required"],
      trim: true,
      index: true,
    },
    timeline: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    deliverables: {
      type: [String],
      default: [],
    },
    techStack: {
      type: [String],
      default: [],
    },
    highlight: {
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

export const Service =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);

export default Service;
