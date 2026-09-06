import mongoose, { Document, Schema } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otp: string;
  type: string;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "registration",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup when expired
    },
  },
  {
    timestamps: true,
  }
);

const Otp = mongoose.models.Otp || mongoose.model<IOtp>("Otp", otpSchema);

export default Otp;
