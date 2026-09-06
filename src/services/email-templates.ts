/**
 * Responsive Dark-Themed HTML Email Templates for Nexora Agency
 * Tested across Gmail, Apple Mail, Outlook, and mobile clients.
 */

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Base HTML Wrapper for cross-client consistency
function wrapEmail(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060a12;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    a { color: #2dd4bf; text-decoration: none; }
    .btn {
      display: inline-block;
      padding: 13px 26px;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: #042f2e !important;
      font-weight: 700;
      font-size: 13px;
      border-radius: 12px;
      text-align: center;
      text-decoration: none;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 20px rgba(20, 184, 166, 0.35);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: monospace;
    }
  </style>
</head>
<body style="margin:0; padding:32px 12px; background-color:#060a12;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0c1322; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.6);" cellpadding="0" cellspacing="0" border="0">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 28px 32px 20px; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, rgba(20,184,166,0.08) 0%, transparent 100%);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="height: 38px; width: 38px; background: linear-gradient(135deg, #2dd4bf, #0f766e); border-radius: 10px; text-align: center; vertical-align: middle; font-weight: 900; font-size: 18px; color: #042f2e;">
                          N
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="font-size: 16px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">NEXORA</span>
                          <span style="font-size: 10px; font-weight: 700; color: #2dd4bf; letter-spacing: 1px; display: block; font-family: monospace;">DIGITAL ENGINEERING</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; color: #64748b; font-family: monospace;">CST CORE AGY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #080d18; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8; font-weight: 600;">
                Nexora Digital Agency • CST Engineering Leadership
              </p>
              <p style="margin: 0 0 12px; font-size: 11px; color: #64748b; line-height: 1.5;">
                Lead Architect: MD Mahfuzul Haque • Direct Hotline: mdmahfuzulhaque3140@gmail.com
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                This is an automated priority dispatch from Nexora Agency. To view and manage your live projects, visit 
                <a href="${CLIENT_URL}/dashboard" style="color: #2dd4bf;">Client Dashboard</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLIENT: Project Request Received Confirmation
// ─────────────────────────────────────────────────────────────────────────────
export function clientProjectRequestConfirmationEmail(data: {
  clientName: string;
  projectTitle: string;
  projectType: string;
  budget: string;
  timeline: string;
}): { subject: string; html: string } {
  const subject = `⚡ Project Brief Received: ${data.projectTitle} | Nexora Engineering`;
  const body = `
    <div style="margin-bottom: 24px;">
      <span class="badge" style="background-color: rgba(20,184,166,0.15); color: #2dd4bf; border: 1px solid rgba(20,184,166,0.3);">
        BRIEF INTAKE CONFIRMED
      </span>
      <h1 style="margin: 12px 0 6px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.4px;">
        Your Project Brief is in Good Hands
      </h1>
      <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Hello <strong style="color: #ffffff;">${data.clientName}</strong>, thank you for trusting Nexora Agency. Our CST engineering leadership has received your project proposal and started architectural review.
      </p>
    </div>

    <!-- Specs Summary Box -->
    <table role="presentation" width="100%" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; margin-bottom: 24px;" cellpadding="16" cellspacing="0">
      <tr>
        <td style="border-bottom: 1px solid #1e293b; width: 35%; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">
          Project Brief
        </td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #ffffff; font-weight: 600;">
          ${data.projectTitle}
        </td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">
          Specification
        </td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #2dd4bf; font-weight: 600; text-transform: capitalize;">
          ${data.projectType.replace("-", " ")}
        </td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">
          Budget Tier
        </td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #f59e0b; font-weight: 700; font-family: monospace;">
          ${data.budget}
        </td>
      </tr>
      <tr>
        <td style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">
          Target Schedule
        </td>
        <td style="font-size: 13px; color: #cbd5e1; font-weight: 500;">
          ${data.timeline}
        </td>
      </tr>
    </table>

    <!-- Next steps SLA -->
    <div style="background: rgba(20,184,166,0.04); border-left: 3px solid #14b8a6; padding: 14px 16px; border-radius: 0 12px 12px 0; margin-bottom: 28px;">
      <h4 style="margin: 0 0 4px; font-size: 13px; color: #ffffff; font-weight: 700;">
        ⏱ 24-Hour Scoping Guarantee
      </h4>
      <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        A senior architect will review your technical requirements and contact you with an architecture outline, component roadmap, and milestone plan.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 12px;">
      <a href="${CLIENT_URL}/dashboard?tab=projects" class="btn">
        Track Live Sprint in Dashboard →
      </a>
    </div>
  `;
  return { subject, html: wrapEmail(subject, body) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ADMIN: New Project Request Alert
// ─────────────────────────────────────────────────────────────────────────────
export function adminNewProjectRequestAlertEmail(data: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  projectTitle: string;
  projectType: string;
  budget: string;
  timeline: string;
  requirements?: string;
}): { subject: string; html: string } {
  const subject = `🚨 New Project Brief: [${data.budget}] ${data.projectTitle} - ${data.clientName}`;
  const body = `
    <div style="margin-bottom: 24px;">
      <span class="badge" style="background-color: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3);">
        NEW CLIENT LEAD
      </span>
      <h1 style="margin: 12px 0 6px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.4px;">
        New Project Brief Submitted
      </h1>
      <p style="margin: 0; font-size: 14px; color: #94a3b8;">
        A new client proposal has been submitted on the Nexora platform.
      </p>
    </div>

    <!-- Client & Project Details -->
    <table role="presentation" width="100%" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; margin-bottom: 20px;" cellpadding="14" cellspacing="0">
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; width: 30%;">Client</td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #ffffff; font-weight: 700;">
          ${data.clientName} <span style="color: #64748b; font-weight: 400;">(${data.clientEmail})</span>
        </td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Company</td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #cbd5e1;">${data.clientCompany || "Individual / Not specified"}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Phone</td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #cbd5e1;">${data.clientPhone || "Not provided"}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Project Title</td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #ffffff; font-weight: 700;">${data.projectTitle}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Budget &amp; Schedule</td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #f59e0b; font-weight: 700; font-family: monospace;">
          ${data.budget} • ${data.timeline}
        </td>
      </tr>
      <tr>
        <td style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Category</td>
        <td style="font-size: 13px; color: #2dd4bf; text-transform: capitalize;">${data.projectType.replace("-", " ")}</td>
      </tr>
    </table>

    ${data.requirements ? `
      <div style="background-color: #030712; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; margin-bottom: 24px;">
        <span style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">Client Requirements Brief</span>
        <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap;">${data.requirements}</p>
      </div>
    ` : ""}

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="${CLIENT_URL}/admin/requests" class="btn">
        Open in Admin Sprint Workspace →
      </a>
    </div>
  `;
  return { subject, html: wrapEmail(subject, body) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CLIENT: Contact Form Confirmation
// ─────────────────────────────────────────────────────────────────────────────
export function clientContactConfirmationEmail(data: {
  name: string;
  subject?: string;
  category?: string;
  message: string;
}): { subject: string; html: string } {
  const subject = `📬 We received your message: ${data.subject || "Inquiry"} | Nexora Agency`;
  const body = `
    <div style="margin-bottom: 20px;">
      <span class="badge" style="background-color: rgba(20,184,166,0.15); color: #2dd4bf; border: 1px solid rgba(20,184,166,0.3);">
        MESSAGE DELIVERED
      </span>
      <h1 style="margin: 12px 0 6px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.4px;">
        Thanks for Reaching Out, ${data.name}!
      </h1>
      <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Your inquiry has been assigned to our customer engineering team. We typically respond within <strong>2 hours</strong> during standard working hours.
      </p>
    </div>

    <!-- Inquiry Quote -->
    <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Your Message</span>
        <span style="font-size: 11px; color: #2dd4bf; font-family: monospace;">[${data.category || "General Inquiry"}]</span>
      </div>
      <p style="margin: 0; font-size: 13px; color: #e2e8f0; font-style: italic; line-height: 1.6;">
        &ldquo;${data.message}&rdquo;
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="${CLIENT_URL}/dashboard?tab=messages" class="btn">
        View Conversation in Dashboard →
      </a>
    </div>
  `;
  return { subject, html: wrapEmail(subject, body) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ADMIN: New Contact Message Alert
// ─────────────────────────────────────────────────────────────────────────────
export function adminNewContactMessageAlertEmail(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  category?: string;
  subject?: string;
  message: string;
}): { subject: string; html: string } {
  const subject = `💬 [${data.category || "Inquiry"}] New Message from ${data.name}`;
  const body = `
    <div style="margin-bottom: 20px;">
      <span class="badge" style="background-color: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3);">
        NEW INCOMING MESSAGE
      </span>
      <h1 style="margin: 12px 0 6px; font-size: 20px; font-weight: 800; color: #ffffff;">
        New Contact Inquiry Received
      </h1>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        Category: <strong style="color: #2dd4bf;">${data.category || "General Inquiry"}</strong>
      </p>
    </div>

    <table role="presentation" width="100%" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 14px; margin-bottom: 18px;" cellpadding="12" cellspacing="0">
      <tr>
        <td style="border-bottom: 1px solid #1e293b; width: 25%; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">From</td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #ffffff; font-weight: 700;">
          ${data.name} &lt;${data.email}&gt;
        </td>
      </tr>
      ${data.company ? `
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Company</td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #cbd5e1;">${data.company}</td>
      </tr>` : ""}
      ${data.phone ? `
      <tr>
        <td style="border-bottom: 1px solid #1e293b; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Phone</td>
        <td style="border-bottom: 1px solid #1e293b; font-size: 13px; color: #cbd5e1;">${data.phone}</td>
      </tr>` : ""}
      <tr>
        <td style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Subject</td>
        <td style="font-size: 13px; color: #ffffff; font-weight: 600;">${data.subject || "No Subject"}</td>
      </tr>
    </table>

    <div style="background-color: #030712; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <span style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">Message Content</span>
      <p style="margin: 0; font-size: 13px; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
    </div>

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="${CLIENT_URL}/admin/messages" class="btn">
        Open Messenger &amp; Reply →
      </a>
    </div>
  `;
  return { subject, html: wrapEmail(subject, body) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CLIENT: Admin Reply to Message
// ─────────────────────────────────────────────────────────────────────────────
export function clientMessageReplyEmail(data: {
  clientName: string;
  adminName: string;
  subject?: string;
  replyText: string;
  originalMessage?: string;
}): { subject: string; html: string } {
  const subject = `💬 New Reply from ${data.adminName || "Nexora Engineering"}: ${data.subject || "Your Inquiry"}`;
  const body = `
    <div style="margin-bottom: 20px;">
      <span class="badge" style="background-color: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);">
        ENGINEER RESPONSE
      </span>
      <h1 style="margin: 12px 0 6px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.4px;">
        New Message from ${data.adminName}
      </h1>
      <p style="margin: 0; font-size: 14px; color: #94a3b8;">
        Regarding: <strong style="color: #ffffff;">${data.subject || "Your Inquiry"}</strong>
      </p>
    </div>

    <!-- Response Box -->
    <div style="background: linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(15,23,42,0.8) 100%); border: 1px solid rgba(20,184,166,0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 11px; color: #2dd4bf; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">
        Message from ${data.adminName} (Nexora Engineering)
      </div>
      <p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6; white-space: pre-wrap;">
        ${data.replyText}
      </p>
    </div>

    ${data.originalMessage ? `
      <div style="background-color: #080d18; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; margin-bottom: 24px;">
        <span style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Original Inquiry</span>
        <p style="margin: 0; font-size: 12px; color: #94a3b8; font-style: italic;">&ldquo;${data.originalMessage}&rdquo;</p>
      </div>
    ` : ""}

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="${CLIENT_URL}/dashboard?tab=messages" class="btn">
        Reply in Client Messenger →
      </a>
    </div>
  `;
  return { subject, html: wrapEmail(subject, body) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CLIENT: Sprint Milestone & Review Ready Alert
// ─────────────────────────────────────────────────────────────────────────────
export function clientSprintUpdateEmail(data: {
  clientName: string;
  projectTitle: string;
  status: string;
  progress: number;
  sprintPhase?: string;
  stagingUrl?: string;
  newUpdateTitle?: string;
  newUpdateNote?: string;
}): { subject: string; html: string } {
  const isReviewReady = data.status === "review-ready";
  const isCompleted = data.status === "completed";

  const subject = isReviewReady
    ? `⭐ Project Review Ready: ${data.projectTitle} | Inspect & Approve`
    : isCompleted
    ? `🚀 Production Deployed: ${data.projectTitle} is Live!`
    : `⚡ Sprint Update: ${data.projectTitle} [${data.progress}% Complete]`;

  const body = `
    <div style="margin-bottom: 24px;">
      <span class="badge" style="${
        isReviewReady
          ? "background-color: rgba(6,182,212,0.15); color: #22d3ee; border: 1px solid rgba(6,182,212,0.3);"
          : isCompleted
          ? "background-color: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);"
          : "background-color: rgba(20,184,166,0.15); color: #2dd4bf; border: 1px solid rgba(20,184,166,0.3);"
      }">
        ${isReviewReady ? "CLIENT QA & REVIEW READY" : isCompleted ? "DEPLOYED TO PRODUCTION" : "SPRINT MILESTONE"}
      </span>
      <h1 style="margin: 12px 0 6px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.4px;">
        ${isReviewReady ? "Your Project is Ready for Client Review!" : isCompleted ? "Congratulations! Project is Live" : "New Engineering Milestone Published"}
      </h1>
      <p style="margin: 0; font-size: 14px; color: #94a3b8;">
        Hello <strong style="color: #ffffff;">${data.clientName}</strong>, your project <strong style="color: #ffffff;">&ldquo;${data.projectTitle}&rdquo;</strong> has reached a new development milestone.
      </p>
    </div>

    <!-- Progress Card -->
    <table role="presentation" width="100%" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; margin-bottom: 22px;" cellpadding="18" cellspacing="0">
      <tr>
        <td>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Completion Progress</span>
            <span style="font-size: 14px; color: #2dd4bf; font-weight: 800; font-family: monospace;">${data.progress}%</span>
          </div>
          <!-- Progress Bar -->
          <div style="background-color: #1e293b; height: 8px; border-radius: 9999px; overflow: hidden; margin-bottom: 12px;">
            <div style="background: linear-gradient(90deg, #14b8a6, #2dd4bf); height: 8px; width: ${data.progress}%; border-radius: 9999px;"></div>
          </div>
          <div style="font-size: 12px; color: #cbd5e1;">
            <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Current Phase:</strong> 
            <span style="color: #ffffff; font-weight: 600; margin-left: 4px;">${data.sprintPhase || "Active Sprint"}</span>
          </div>
        </td>
      </tr>
    </table>

    ${data.newUpdateTitle ? `
      <!-- Milestone Log Note -->
      <div style="background-color: #030712; border-left: 3px solid #2dd4bf; border-radius: 0 12px 12px 0; padding: 16px; margin-bottom: 24px;">
        <span style="font-size: 10px; color: #2dd4bf; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
          Milestone Changelog
        </span>
        <h3 style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #ffffff;">${data.newUpdateTitle}</h3>
        <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.6;">${data.newUpdateNote || ""}</p>
      </div>
    ` : ""}

    ${data.stagingUrl ? `
      <div style="background: rgba(6,182,212,0.06); border: 1px dashed rgba(6,182,212,0.4); border-radius: 14px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 11px; color: #22d3ee; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Live Staging Sandbox</span>
        <a href="${data.stagingUrl}" style="color: #ffffff; font-weight: 700; font-size: 13px; font-family: monospace; text-decoration: underline;">
          ${data.stagingUrl} ↗
        </a>
      </div>
    ` : ""}

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="${CLIENT_URL}/dashboard?tab=projects" class="btn">
        ${isReviewReady ? "Inspect Staging & Submit Review ⭐" : "View Live Pipeline in Dashboard →"}
      </a>
    </div>
  `;
  return { subject, html: wrapEmail(subject, body) };
}
