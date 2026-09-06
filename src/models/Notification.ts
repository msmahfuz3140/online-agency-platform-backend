import mongoose, { Document, Schema, Model } from "mongoose";

export interface INotification extends Document {
  recipientRole: "admin" | "client";
  recipientEmail?: string;
  recipientId?: string;
  type: "project_request" | "project_review" | "sprint_update" | "message" | "reply" | "user_register";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientRole: {
      type: String,
      enum: ["admin", "client"],
      required: true,
      default: "admin",
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    recipientId: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["project_request", "project_review", "sprint_update", "message", "reply", "user_register"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ recipientEmail: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
