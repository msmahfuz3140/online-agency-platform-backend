import nodemailer, { type Transporter } from "nodemailer";
import dotenv from "dotenv";
import {
  clientProjectRequestConfirmationEmail,
  adminNewProjectRequestAlertEmail,
  clientContactConfirmationEmail,
  adminNewContactMessageAlertEmail,
  clientMessageReplyEmail,
  clientSprintUpdateEmail,
  clientOtpVerificationEmail,
  clientProjectCompletionEmail,
  adminProjectCompletedAlertEmail,
} from "./email-templates.js";

dotenv.config();

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "nexora.agency.3140@gmail.com";

let transporter: Transporter | null = null;
let initialized = false;

function getTransporter(): Transporter | null {
  if (initialized) return transporter;
  initialized = true;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || "nexora.agency.3140@gmail.com";
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : "";

  if (user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      console.log(`📧 [EMAIL DISPATCHER] Nodemailer initialized with ${host}:${port} (${user})`);
    } catch (err) {
      console.error("❌ [EMAIL DISPATCHER] Failed to create nodemailer transporter:", err);
      transporter = null;
    }
  } else {
    console.log("ℹ️  [EMAIL DISPATCHER] Running in Dev Mock Mode. Set SMTP_PASS in .env to deliver real emails.");
  }

  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Core sendMail function with graceful developer fallback
 */
export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; mocked?: boolean }> {
  const { to, subject, html, text } = options;

  const tx = getTransporter();
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : "";
  const senderAddress = (process.env.SMTP_USER || "nexora.agency.3140@gmail.com").trim();
  const senderName = "Nexora Agency";

  // If real transporter is available, dispatch via SMTP
  if (tx && pass) {
    try {
      const info = await tx.sendMail({
        from: {
          name: senderName,
          address: senderAddress,
        },
        replyTo: senderAddress,
        to,
        subject,
        html,
        text: text || subject,
      });
      console.log(`✅ [REAL EMAIL DISPATCHED TO INBOX] To: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ [EMAIL DISPATCH FAILED] To: ${to} | Subject: "${subject}" | Error:`, error);
      return { success: false };
    }
  }

  // Developer Fallback Logger (Logs email event nicely to console)
  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`📬 [EMAIL DISPATCHER - DEV SIMULATION]`);
  console.log(`• To:      ${to}`);
  console.log(`• From:    "${senderName}" <${senderAddress}>`);
  console.log(`• Subject: ${subject}`);
  console.log(`• Note:    SMTP_PASS is not configured in .env. Email logged successfully.`);
  console.log(`══════════════════════════════════════════════════════════════════════════════\n`);

  return { success: true, mocked: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGHER LEVEL DISPATCH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triggered when a client submits a new project request / brief.
 * Sends confirmation to client and alert to agency admin.
 */
export async function sendProjectRequestEmails(request: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  projectTitle: string;
  projectType: string;
  budget: string;
  timeline: string;
  requirements?: string;
  attachments?: Array<{ url: string; name: string; size?: number }>;
}): Promise<void> {
  // 1. Send confirmation to client
  if (request.clientEmail) {
    const clientEmailData = clientProjectRequestConfirmationEmail({
      clientName: request.clientName,
      projectTitle: request.projectTitle,
      projectType: request.projectType,
      budget: request.budget,
      timeline: request.timeline,
    });
    sendMail({
      to: request.clientEmail,
      subject: clientEmailData.subject,
      html: clientEmailData.html,
    }).catch((err) => console.error("Error sending client project email:", err));
  }

  // 2. Send intake alert to admin
  const adminEmailData = adminNewProjectRequestAlertEmail({
    clientName: request.clientName,
    clientEmail: request.clientEmail,
    clientPhone: request.clientPhone,
    clientCompany: request.clientCompany,
    projectTitle: request.projectTitle,
    projectType: request.projectType,
    budget: request.budget,
    timeline: request.timeline,
    requirements: request.requirements,
    attachments: request.attachments,
  });
  sendMail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: adminEmailData.subject,
    html: adminEmailData.html,
  }).catch((err) => console.error("Error sending admin project email:", err));
}

/**
 * Triggered when someone submits a contact inquiry or support message.
 * Sends confirmation to sender and alert to agency admin.
 */
export async function sendContactEmails(contact: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  category?: string;
  subject?: string;
  message: string;
}): Promise<void> {
  // 1. Send confirmation to sender
  if (contact.email) {
    const clientData = clientContactConfirmationEmail({
      name: contact.name,
      subject: contact.subject,
      category: contact.category,
      message: contact.message,
    });
    sendMail({
      to: contact.email,
      subject: clientData.subject,
      html: clientData.html,
    }).catch((err) => console.error("Error sending client contact email:", err));
  }

  // 2. Send alert to admin
  const adminData = adminNewContactMessageAlertEmail({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    category: contact.category,
    subject: contact.subject,
    message: contact.message,
  });
  sendMail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: adminData.subject,
    html: adminData.html,
  }).catch((err) => console.error("Error sending admin contact email:", err));
}

/**
 * Triggered when an admin replies to a client message thread.
 */
export async function sendAdminReplyToClient(params: {
  clientName: string;
  clientEmail: string;
  adminName: string;
  subject?: string;
  replyText: string;
  originalMessage?: string;
}): Promise<void> {
  if (!params.clientEmail) return;

  const data = clientMessageReplyEmail({
    clientName: params.clientName,
    adminName: params.adminName,
    subject: params.subject,
    replyText: params.replyText,
    originalMessage: params.originalMessage,
  });

  sendMail({
    to: params.clientEmail,
    subject: data.subject,
    html: data.html,
  }).catch((err) => console.error("Error sending admin reply email:", err));
}

/**
 * Triggered when an admin updates a project sprint (e.g. review-ready or milestone note).
 */
export async function sendSprintUpdateToClient(params: {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  status: string;
  progress: number;
  sprintPhase?: string;
  stagingUrl?: string;
  newUpdateTitle?: string;
  newUpdateNote?: string;
}): Promise<void> {
  if (!params.clientEmail) return;

  const data = clientSprintUpdateEmail({
    clientName: params.clientName,
    projectTitle: params.projectTitle,
    status: params.status,
    progress: params.progress,
    sprintPhase: params.sprintPhase,
    stagingUrl: params.stagingUrl,
    newUpdateTitle: params.newUpdateTitle,
    newUpdateNote: params.newUpdateNote,
  });

  sendMail({
    to: params.clientEmail,
    subject: data.subject,
    html: data.html,
  }).catch((err) => console.error("Error sending sprint update email:", err));
}

/**
 * Triggered when a user requests an OTP code for registration or email verification.
 */
export async function sendOtpVerificationEmail(params: {
  email: string;
  name?: string;
  otp: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; mocked?: boolean }> {
  if (!params.email) return { success: false };

  const data = clientOtpVerificationEmail({
    name: params.name,
    otp: params.otp,
    expiresInMinutes: params.expiresInMinutes || 10,
  });

  return sendMail({
    to: params.email,
    subject: data.subject,
    html: data.html,
  });
}

/**
 * Triggered when a project is completed (client signs off / rates or admin marks completed).
 * Sends celebratory completion summary to client and alert with review rating to admin.
 */
export async function sendProjectCompletionEmails(params: {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  rating?: number;
  feedback?: string;
  stagingUrl?: string;
  approved?: boolean;
}): Promise<void> {
  // 1. Client Completion & Celebration Email
  if (params.clientEmail) {
    const clientData = clientProjectCompletionEmail({
      clientName: params.clientName,
      projectTitle: params.projectTitle,
      rating: params.rating,
      feedback: params.feedback,
      stagingUrl: params.stagingUrl,
    });
    sendMail({
      to: params.clientEmail,
      subject: clientData.subject,
      html: clientData.html,
    }).catch((err) => console.error("❌ Error sending client project completion email:", err));
  }

  // 2. Admin Alert Email
  const adminData = adminProjectCompletedAlertEmail({
    clientName: params.clientName,
    clientEmail: params.clientEmail,
    projectTitle: params.projectTitle,
    rating: params.rating,
    feedback: params.feedback,
    approved: params.approved !== undefined ? params.approved : true,
  });
  sendMail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: adminData.subject,
    html: adminData.html,
  }).catch((err) => console.error("❌ Error sending admin project completion alert:", err));
}

// ─── Manual Payment Notification (bKash / Nagad) ──────────────────────────────
export async function sendManualPaymentNotification(params: {
  clientName: string;
  clientEmail: string;
  plan: string;
  method: string;
  amount: string;
  senderNumber: string;
  transactionId: string;
  paymentId: string;
}): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
      <h2 style="color: #14b8a6; margin-bottom: 8px;">💳 Manual Payment Confirmation Received</h2>
      <p style="color: #94a3b8; margin-bottom: 24px;">A client has submitted a ${params.method} payment and is awaiting verification.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 40%;">Client Name</td><td style="padding: 8px 0; font-weight: bold;">${params.clientName}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Client Email</td><td style="padding: 8px 0;">${params.clientEmail}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Plan</td><td style="padding: 8px 0; color: #14b8a6; font-weight: bold;">${params.plan}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Payment Method</td><td style="padding: 8px 0;">${params.method}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Amount</td><td style="padding: 8px 0; font-weight: bold;">${params.amount}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Sender Number</td><td style="padding: 8px 0;">${params.senderNumber}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Transaction ID</td><td style="padding: 8px 0; font-family: monospace; color: #f59e0b;">${params.transactionId}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Payment DB ID</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${params.paymentId}</td></tr>
      </table>
      <p style="margin-top: 24px; padding: 16px; background: #1e293b; border-radius: 8px; border-left: 4px solid #f59e0b; color: #fbbf24;">
        ⚠️ Please verify this transaction in the ${params.method} merchant app and confirm the payment in the admin panel.
      </p>
    </div>
  `;

  sendMail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `🔔 [${params.method} Payment] ${params.clientName} — ${params.plan} — Awaiting Verification`,
    html,
  }).catch((err) => console.error("❌ Error sending manual payment notification:", err));
}

// ─── Payment Confirmation Email to Client ─────────────────────────────────────
export async function sendPaymentConfirmationEmail(params: {
  clientName: string;
  clientEmail: string;
  plan: string;
  method: string;
  amount: string;
  transactionId: string;
}): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
      <h2 style="color: #14b8a6; margin-bottom: 8px;">✅ Payment Confirmed!</h2>
      <p>Hi ${params.clientName}, your payment for <strong>${params.plan}</strong> has been confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 40%;">Plan</td><td style="color: #14b8a6; font-weight: bold;">${params.plan}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Amount</td><td style="font-weight: bold;">${params.amount}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Method</td><td>${params.method}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;">Transaction ID</td><td style="font-family: monospace; color: #f59e0b;">${params.transactionId}</td></tr>
      </table>
      <p style="color: #94a3b8;">Our team will contact you within 24 hours to kickstart your project. 🚀</p>
      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">— Nexora Agency Team</p>
    </div>
  `;

  sendMail({
    to: params.clientEmail,
    subject: `✅ Payment Confirmed — ${params.plan} | Nexora Agency`,
    html,
  }).catch((err) => console.error("❌ Error sending payment confirmation email:", err));
}
