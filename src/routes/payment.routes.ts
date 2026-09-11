import { Router, Request, Response } from "express";
import Stripe from "stripe";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import { getMongoClient } from "../config/db.js";
import { sendPaymentConfirmationEmail, sendManualPaymentNotification } from "../services/email.service.js";

const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";

const router = Router();

// ─── Stripe Setup ──────────────────────────────────────────────────────────────
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
let stripe: Stripe | null = null;

if (stripeSecretKey && stripeSecretKey !== "sk_test_YOUR_STRIPE_SECRET_KEY_HERE") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-08-26.dahlia" as any });
}

// ─── Plan Pricing ──────────────────────────────────────────────────────────────
export const PLAN_PRICES = {
  pro: {
    usd: 4900,        // $49.00 in cents
    bdt: 549000,      // ৳5,490 in paisa
    label: "Pro Plan",
  },
  business: {
    usd: 19900,       // $199.00 in cents
    bdt: 2199000,     // ৳21,990 in paisa
    label: "Business Plan",
  },
};

// Manual payment contact info (Nexora)
const BKASH_NUMBER = "01XXXXXXXXX";  // Replace with real bKash merchant number
const NAGAD_NUMBER = "01XXXXXXXXX";  // Replace with real Nagad merchant number

// ─── Create Stripe PaymentIntent ───────────────────────────────────────────────
router.post("/create-stripe-intent", async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, clientName, clientEmail, userId } = req.body;

    if (!["pro", "business"].includes(planId)) {
      res.status(400).json({ success: false, message: "Invalid plan selected" });
      return;
    }

    const plan = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
    const amount = plan.usd;

    if (!stripe) {
      // Stripe not configured — return a test/mock response
      res.json({
        success: true,
        mock: true,
        clientSecret: "pi_mock_secret_" + Date.now(),
        paymentId: "mock_" + Date.now(),
        amount,
        currency: "usd",
        message: "⚠️ Stripe test mode (keys not configured)",
      });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      description: `Nexora Agency — ${plan.label}`,
      receipt_email: clientEmail || undefined,
      metadata: {
        planId,
        clientName: clientName || "",
        clientEmail: clientEmail || "",
        userId: userId || "",
      },
    });

    // Save to DB as pending
    const payment = await Payment.create({
      userId: userId || null,
      clientName: clientName || "Anonymous",
      clientEmail: clientEmail || "",
      plan: planId,
      amount,
      currency: "usd",
      method: "stripe",
      status: "pending",
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret ?? "",
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: String(payment._id),
      amount,
      currency: "usd",
    });
  } catch (err) {
    console.error("Stripe intent error:", err);
    res.status(500).json({ success: false, message: "Failed to create payment intent" });
  }
});

// ─── Stripe Webhook ────────────────────────────────────────────────────────────
router.post("/stripe-webhook", async (req: Request, res: Response): Promise<void> => {
  if (!stripe) {
    res.json({ received: true });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: pi.id },
      { status: "completed", transactionId: pi.id }
    );
  } else if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: pi.id },
      { status: "failed" }
    );
  }

  res.json({ received: true });
});

// ─── Confirm Stripe Payment (client-side callback) ────────────────────────────
router.post("/confirm-stripe-payment", async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentIntentId, planId, clientName, clientEmail, userId } = req.body;

    if (!paymentIntentId) {
      res.status(400).json({ success: false, message: "Missing paymentIntentId" });
      return;
    }

    let status: "completed" | "pending" = "completed";

    if (stripe) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      status = pi.status === "succeeded" ? "completed" : "pending";
    }

    // Upsert payment record
    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

    if (!payment) {
      const plan = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
      payment = await Payment.create({
        userId: userId || null,
        clientName: clientName || "Anonymous",
        clientEmail: clientEmail || "",
        plan: planId,
        amount: plan?.usd || 0,
        currency: "usd",
        method: "stripe",
        status,
        stripePaymentIntentId: paymentIntentId,
        transactionId: paymentIntentId,
      });
    } else {
      payment.status = status;
      await payment.save();
    }

    res.json({ success: true, status, paymentId: payment._id });
  } catch (err) {
    console.error("Confirm Stripe payment error:", err);
    res.status(500).json({ success: false, message: "Failed to confirm payment" });
  }
});

// ─── Manual bKash Payment — Submit Confirmation ───────────────────────────────
router.post("/submit-bkash-confirmation", async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, clientName, clientEmail, userId, senderMobileNumber, transactionId, screenshotNote, screenshotUrl } = req.body;

    if (!["pro", "business"].includes(planId)) {
      res.status(400).json({ success: false, message: "Invalid plan" });
      return;
    }
    if (!senderMobileNumber || !transactionId) {
      res.status(400).json({ success: false, message: "Sender number and transaction ID are required" });
      return;
    }

    // Validate Bangladeshi 11-digit mobile phone number
    const cleanPhone = String(senderMobileNumber || "").replace(/[\s-]/g, "").replace(/^(\+?88)/, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid 11-digit Bangladeshi mobile number starting with 01 (e.g. 01712345678)",
      });
      return;
    }

    const plan = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];

    const payment = await Payment.create({
      userId: userId || null,
      clientName: clientName || "Anonymous",
      clientEmail: clientEmail || "",
      plan: planId,
      amount: plan.bdt,
      currency: "bdt",
      method: "bkash",
      status: "awaiting_confirmation",
      senderMobileNumber: cleanPhone,
      transactionId: String(transactionId).trim().toUpperCase(),
      screenshotUrl: screenshotUrl || screenshotNote || "",
      screenshotNote: screenshotNote || "",
    });

    // Notify admin
    try {
      await sendManualPaymentNotification({
        clientName: clientName || "Anonymous",
        clientEmail: clientEmail || "",
        plan: plan.label,
        method: "bKash",
        amount: `৳${(plan.bdt / 100).toLocaleString()}`,
        senderNumber: cleanPhone,
        transactionId: String(transactionId).trim().toUpperCase(),
        paymentId: String(payment._id),
      });
    } catch (emailErr) {
      console.error("Failed to send bKash notification email:", emailErr);
    }

    // Create admin notification
    try {
      await Notification.create({
        recipientRole: "admin",
        type: "payment",
        title: `💳 New bKash Payment: ${plan.label}`,
        message: `${clientName || "Client"} (${cleanPhone}) sent ৳${(plan.bdt / 100).toLocaleString()} (TxID: ${transactionId}). Awaiting verification.`,
        link: `/admin/payments`,
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification:", notifErr);
    }

    res.json({
      success: true,
      paymentId: payment._id,
      message: "Payment confirmation received. Our team will verify within 24 hours.",
    });
  } catch (err) {
    console.error("bKash submit error:", err);
    res.status(500).json({ success: false, message: "Failed to submit bKash confirmation" });
  }
});

// ─── Manual Nagad Payment — Submit Confirmation ───────────────────────────────
router.post("/submit-nagad-confirmation", async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, clientName, clientEmail, userId, senderMobileNumber, transactionId, screenshotNote, screenshotUrl } = req.body;

    if (!["pro", "business"].includes(planId)) {
      res.status(400).json({ success: false, message: "Invalid plan" });
      return;
    }
    if (!senderMobileNumber || !transactionId) {
      res.status(400).json({ success: false, message: "Sender number and transaction ID are required" });
      return;
    }

    // Validate Bangladeshi 11-digit mobile phone number
    const cleanPhone = String(senderMobileNumber || "").replace(/[\s-]/g, "").replace(/^(\+?88)/, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid 11-digit Bangladeshi mobile number starting with 01 (e.g. 01712345678)",
      });
      return;
    }

    const plan = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];

    const payment = await Payment.create({
      userId: userId || null,
      clientName: clientName || "Anonymous",
      clientEmail: clientEmail || "",
      plan: planId,
      amount: plan.bdt,
      currency: "bdt",
      method: "nagad",
      status: "awaiting_confirmation",
      senderMobileNumber: cleanPhone,
      transactionId: String(transactionId).trim().toUpperCase(),
      screenshotUrl: screenshotUrl || screenshotNote || "",
      screenshotNote: screenshotNote || "",
    });

    // Notify admin
    try {
      await sendManualPaymentNotification({
        clientName: clientName || "Anonymous",
        clientEmail: clientEmail || "",
        plan: plan.label,
        method: "Nagad",
        amount: `৳${(plan.bdt / 100).toLocaleString()}`,
        senderNumber: cleanPhone,
        transactionId: String(transactionId).trim().toUpperCase(),
        paymentId: String(payment._id),
      });
    } catch (emailErr) {
      console.error("Failed to send Nagad notification email:", emailErr);
    }

    // Create admin notification
    try {
      await Notification.create({
        recipientRole: "admin",
        type: "payment",
        title: `💳 New Nagad Payment: ${plan.label}`,
        message: `${clientName || "Client"} (${cleanPhone}) sent ৳${(plan.bdt / 100).toLocaleString()} (TxID: ${transactionId}). Awaiting verification.`,
        link: `/admin/payments`,
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification:", notifErr);
    }

    res.json({
      success: true,
      paymentId: payment._id,
      message: "Payment confirmation received. Our team will verify within 24 hours.",
    });
  } catch (err) {
    console.error("Nagad submit error:", err);
    res.status(500).json({ success: false, message: "Failed to submit Nagad confirmation" });
  }
});

// ─── Get payment contact info (bKash/Nagad numbers) ──────────────────────────
router.get("/contact-info", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      bkash: process.env.BKASH_MERCHANT_NUMBER || BKASH_NUMBER,
      nagad: process.env.NAGAD_MERCHANT_NUMBER || NAGAD_NUMBER,
    },
  });
});

// ─── Admin: Get all payments ───────────────────────────────────────────────────
router.get("/admin/all", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, method, plan } = req.query;
    const filter: Record<string, any> = {};
    if (status && status !== "all") filter.status = status;
    if (method && method !== "all") filter.method = method;
    if (plan && plan !== "all") filter.plan = plan;

    const payments = await Payment.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
});

// ─── Admin: Payment Stats ──────────────────────────────────────────────────────
router.get("/admin/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, awaiting, completed, failed] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: "awaiting_confirmation" }),
      Payment.countDocuments({ status: "completed" }),
      Payment.countDocuments({ status: "failed" }),
    ]);

    const completedPayments = await Payment.find({ status: "completed" }).select("amount currency");
    let totalBDT = 0;
    let totalUSD = 0;
    for (const p of completedPayments) {
      if (p.currency === "bdt") totalBDT += p.amount;
      else totalUSD += p.amount;
    }

    res.json({
      success: true,
      data: {
        total,
        awaiting,
        completed,
        failed,
        totalRevenueBDT: Math.round(totalBDT / 100),
        totalRevenueUSD: Math.round(totalUSD / 100),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch payment stats" });
  }
});

// ─── Admin: Confirm manual payment & activate user subscription ───────────────
router.patch("/admin/confirm/:paymentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { adminNotes } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: "completed", adminConfirmed: true, adminNotes: adminNotes || "Verified and approved by admin" },
      { new: true }
    );

    if (!payment) {
      res.status(404).json({ success: false, message: "Payment not found" });
      return;
    }

    // Activate subscription and bonus credits in MongoDB User collection
    const bonusCredits = payment.plan === "business" ? 500 : 100;
    try {
      const client = getMongoClient();
      const db = client.db(DB_NAME);

      const userQuery: any = payment.userId
        ? { $or: [{ id: payment.userId }, { email: payment.clientEmail.toLowerCase() }] }
        : { email: payment.clientEmail.toLowerCase() };

      await db.collection("user").updateOne(userQuery, {
        $set: {
          plan: payment.plan,
          planStatus: "active",
          planActivatedAt: new Date(),
          planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        $inc: {
          aiCreditsRemaining: bonusCredits,
        },
      });
    } catch (userUpdateErr) {
      console.error("Failed to update user plan in MongoDB:", userUpdateErr);
    }

    // Send client notification
    try {
      await Notification.create({
        recipientRole: "client",
        recipientEmail: payment.clientEmail,
        recipientId: payment.userId || "",
        type: "payment",
        title: `🎉 ${payment.plan.toUpperCase()} Plan Activated!`,
        message: `Your payment for ${payment.plan === "business" ? "Business" : "Pro"} Plan has been verified. You received +${bonusCredits} AI Credits and all premium features are active.`,
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to create client notification:", notifErr);
    }

    // Send confirmation email
    try {
      await sendPaymentConfirmationEmail({
        clientName: payment.clientName,
        clientEmail: payment.clientEmail,
        plan: payment.plan === "business" ? "Business Plan" : "Pro Plan",
        amount: payment.currency === "bdt" ? `৳${(payment.amount / 100).toLocaleString()}` : `$${payment.amount / 100}`,
        method: payment.method.toUpperCase(),
        transactionId: payment.transactionId || String(payment._id),
      });
    } catch (emailErr) {
      console.error("Failed to send payment confirmation email:", emailErr);
    }

    res.json({
      success: true,
      data: payment,
      message: `${payment.plan.toUpperCase()} plan activated successfully. User received +${bonusCredits} AI credits.`,
    });
  } catch (err) {
    console.error("Admin confirm payment error:", err);
    res.status(500).json({ success: false, message: "Failed to confirm payment" });
  }
});

// ─── Admin: Reject manual payment ──────────────────────────────────────────────
router.patch("/admin/reject/:paymentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: "failed",
        adminConfirmed: false,
        adminNotes: reason || "Payment rejected by admin (invalid transaction or amount mismatch)",
      },
      { new: true }
    );

    if (!payment) {
      res.status(404).json({ success: false, message: "Payment not found" });
      return;
    }

    // Send client notification
    try {
      await Notification.create({
        recipientRole: "client",
        recipientEmail: payment.clientEmail,
        recipientId: payment.userId || "",
        type: "payment",
        title: `⚠️ Payment Verification Failed`,
        message: `Your manual payment (${payment.method.toUpperCase()} TxID: ${payment.transactionId}) could not be verified. Note: ${reason || "Invalid details"}`,
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to create rejection notification:", notifErr);
    }

    res.json({ success: true, data: payment, message: "Payment marked as rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reject payment" });
  }
});

// ─── Get payment history for a user/email ────────────────────────────────────
router.get("/history", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, userId } = req.query;
    const query: Record<string, string> = {};
    if (email) query.clientEmail = email as string;
    if (userId) query.userId = userId as string;

    const payments = await Payment.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch payment history" });
  }
});

export default router;
