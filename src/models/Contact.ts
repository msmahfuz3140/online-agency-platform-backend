import mongoose, { Document, Schema, Model } from "mongoose";

export interface IReply {
  _id?: string;
  sender: "admin" | "user";
  senderName: string;
  senderEmail?: string;
  message: string;
  createdAt: Date;
}

export interface IContact extends Document {
  name: string;
  email: string;
  message: string;
  subject?: string;
  category?: string;
  phone?: string;
  company?: string;
  status: "unread" | "read" | "archived" | "replied";
  replies: IReply[];
  userId?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const replySchema = new Schema<IReply>(
  {
    sender: {
      type: String,
      enum: ["admin", "user"],
      required: true,
      default: "admin",
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      default: "Admin Support",
    },
    senderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [5, "Message must be at least 5 characters long"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
      default: "General Inquiry",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived", "replied"],
      default: "unread",
    },
    replies: {
      type: [replySchema],
      default: [],
    },
    userId: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>("Contact", contactSchema);

export default Contact;

