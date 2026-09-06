import nodemailer, { type Transporter } from "nodemailer";
import {
  clientProjectRequestConfirmationEmail,
  adminNewProjectRequestAlertEmail,
  clientContactConfirmationEmail,
  adminNewContactMessageAlertEmail,
  clientMessageReplyEmail,
  clientSprintUpdateEmail,
} from "./email-templates.js";

// Load SMTP configurations from environment
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE === "true" || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || "mdmahfuzulhaque3140@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : "";
const EMAIL_FROM = process.env.EMAIL_FROM || `Nexora Agency <${SMTP_USER}>`;
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "mdmahfuzulhaque3140@gmail.com";

let transporter: Transporter | null = null;

// Initialize Nodemailer transporter if credentials are provided
if (SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`📧 [EMAIL DISPATCHER] Nodemailer initialized with ${SMTP_HOST}:${SMTP_PORT} (${SMTP_USER})`);
  } catch (err) {
    console.error("❌ [EMAIL DISPATCHER] Failed to create nodemailer transporter:", err);
    transporter = null;
  }
} else {
  console.log("ℹ️  [EMAIL DISPATCHER] Running in Dev Mock Mode. Set SMTP_PASS in .env to deliver real emails.");
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

  // If real transporter is available, dispatch via SMTP
  if (transporter && SMTP_PASS) {
    try {
      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        text: text || subject,
      });
      console.log(`✅ [EMAIL DISPATCHED] To: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
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
  console.log(`• From:    ${EMAIL_FROM}`);
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
