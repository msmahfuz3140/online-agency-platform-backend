import mongoose, { Document, Schema, Model } from "mongoose";

export type PaymentMethod = "stripe" | "bkash" | "nagad";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "awaiting_confirmation";
export type PlanId = "free" | "pro" | "business";

export interface IPayment extends Document {
  userId?: string;
  clientName: string;
  clientEmail: string;
  plan: PlanId;
  amount: number; // in cents for Stripe (USD), or BDT paisa for bKash/Nagad
  currency: "usd" | "bdt";
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;        // bKash/Nagad transaction ID
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  bkashPaymentId?: string;
  nagadOrderId?: string;
  senderMobileNumber?: string;   // bKash/Nagad sender number
  screenshotUrl?: string;        // Payment screenshot URL
  screenshotNote?: string;       // Manual confirmation note from client
  adminConfirmed?: boolean;      // Admin manually confirms manual payments
  adminNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: String, default: null },
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    clientEmail: {
      type: String,
      required: [true, "Client email is required"],
      trim: true,
      lowercase: true,
    },
    plan: {
      type: String,
      required: true,
      enum: ["free", "pro", "business"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: ["usd", "bdt"],
      default: "usd",
    },
    method: {
      type: String,
      required: true,
      enum: ["stripe", "bkash", "nagad"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded", "awaiting_confirmation"],
      default: "pending",
    },
    transactionId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
    stripeClientSecret: { type: String, default: null },
    bkashPaymentId: { type: String, default: null },
    nagadOrderId: { type: String, default: null },
    senderMobileNumber: { type: String, default: null },
    screenshotUrl: { type: String, default: null },
    screenshotNote: { type: String, default: null },
    adminConfirmed: { type: Boolean, default: false },
    adminNotes: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ clientEmail: 1, createdAt: -1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
