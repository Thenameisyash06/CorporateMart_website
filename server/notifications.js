const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const nodemailer = require('nodemailer');
const webpush = require('web-push');

// 1. Configure Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@corporatemart.in';

let isPushConfigured = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    isPushConfigured = true;
  } catch (err) {
    console.warn('⚠️ Web Push VAPID initialization warning:', err.message);
  }
}

// 2. Configure Email Transporter
const APP_URL = (process.env.APP_URL || 'https://corporatemart.in').replace(/\/$/, '');
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_USER = (process.env.SMTP_USER || '').trim();
const SMTP_PASS = (process.env.SMTP_PASS || '').trim();
const rawEmailFrom = (process.env.EMAIL_FROM || '').trim();

let transporter = null;
let senderEmail = rawEmailFrom;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  const cleanPass = SMTP_PASS.replace(/\s+/g, '');
  const isGmail = SMTP_HOST.toLowerCase().includes('gmail') || SMTP_USER.toLowerCase().includes('@gmail.com');

  if (isGmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: cleanPass
      }
    });
    senderEmail = `"Corporate Mart" <${SMTP_USER}>`;
  } else {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: cleanPass
      }
    });
    senderEmail = rawEmailFrom || `"Corporate Mart" <${SMTP_USER}>`;
  }
  console.log(`✉️ [EMAIL] Transporter ready for ${SMTP_USER} (${isGmail ? 'Gmail Service' : SMTP_HOST})`);
}

/**
 * Base HTML Email Template with Corporate Mart branding
 */
function buildEmailTemplate({ heading, title, bodyHtml, buttonText, buttonUrl, note }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:20px; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.06); border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background-color:#0f172a; padding:28px 32px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:0.5px;">
              CORPORATE MART
            </h1>
            <p style="color:#38bdf8; margin:6px 0 0 0; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
              ${heading || 'Client Compliance Alert'}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#0f172a; font-size:19px; font-weight:700; margin:0 0 16px 0;">
              ${title}
            </h2>
            <div style="font-size:15px; line-height:1.6; color:#334155;">
              ${bodyHtml}
            </div>

            ${
              buttonText && buttonUrl
                ? `
              <div style="margin:30px 0 20px 0; text-align:center;">
                <a href="${buttonUrl}" style="background-color:#2563eb; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:8px; font-weight:700; font-size:14px; display:inline-block; box-shadow:0 4px 10px rgba(37,99,235,0.3);">
                  ${buttonText}
                </a>
              </div>
            `
                : ''
            }

            ${
              note
                ? `
              <div style="margin-top:20px; padding:12px 16px; background-color:#f8fafc; border-left:4px solid #94a3b8; border-radius:4px; font-size:13px; color:#64748b;">
                ${note}
              </div>
            `
                : ''
            }
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center; font-size:12px; color:#64748b;">
            <p style="margin:0 0 6px 0;">Corporate Mart • Legal & Compliance Consultations • India</p>
            <p style="margin:0;">Support Hotline: <a href="tel:+917041554148" style="color:#2563eb; text-decoration:none; font-weight:600;">+91 7041554148</a> | Email: <a href="mailto:contact@corporatemart.in" style="color:#2563eb; text-decoration:none;">contact@corporatemart.in</a></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Dispatch notification across Email and In-Phone Web Push
 */
async function notifyClient({ client, eventType, data }) {
  if (!client) return { success: false, reason: 'No client provided' };

  let title = '';
  let pushBody = '';
  let pushUrl = '/client';
  let emailHtml = '';
  let emailText = '';
  let emailSubject = '';

  const companyName = client.companyName || client.name || 'Your Company';
  const directorName = client.name || 'Director';

  // -------------------------------------------------------------
  // EVENT 1: DOCUMENT UPLOADED & AUTO-APPROVED
  // -------------------------------------------------------------
  if (eventType === 'document_uploaded') {
    const docTitle = data.title || 'Official Document';
    const fileName = data.fileName || '';
    const caseId = data.caseId || '';

    title = `📁 Document Ready: ${docTitle}`;
    pushBody = `Your document has been issued for ${companyName} and marked Completed. Tap to preview & download!`;
    pushUrl = '/client#documents';

    emailSubject = `✅ Document Ready: ${docTitle} issued for ${companyName}`;
    emailText = `Dear ${directorName},\n\nYour Corporate Mart operations team has uploaded and issued your official document: ${docTitle}.\n\nThe related compliance service case ${caseId} has been marked as Approved (Completed).\n\nYou can view and download your certificate here:\n${APP_URL}/client#documents\n\nCorporate Mart • Legal & Compliance Services`;
    emailHtml = buildEmailTemplate({
      heading: 'Document Delivery & Service Completion',
      title: `Your official document is ready!`,
      bodyHtml: `
        <p>Dear <strong>${directorName}</strong>,</p>
        <p>Your Corporate Mart operations team has uploaded and issued your official document: <strong>${docTitle}</strong>.</p>
        <p>The related compliance service case <code>${caseId}</code> has been marked as <strong>Approved (Completed)</strong>.</p>
        <p>You can preview this certificate directly in your browser or download it in full quality.</p>
      `,
      buttonText: 'View & Download Document',
      buttonUrl: `${APP_URL}/client#documents`,
      note: `File Name: ${fileName} • Auto-approved by Corporate Mart Operations.`
    });
  }

  // -------------------------------------------------------------
  // EVENT 2: SERVICE STATUS REJECTED / NEEDS ATTENTION
  // -------------------------------------------------------------
  else if (eventType === 'case_rejected') {
    const serviceName = data.serviceName || 'Service Filing';
    const statusNote = data.statusNote || 'Filing requires revision or resubmission of documents.';
    const caseId = data.caseId || '';

    title = `⚠️ Action Required: ${serviceName}`;
    pushBody = `${statusNote}`;
    pushUrl = '/client#services';

    emailSubject = `⚠️ Action Required: Update regarding your ${serviceName} (${companyName})`;
    emailText = `Dear ${directorName},\n\nThere is an update requiring your attention regarding your ${serviceName} application (${caseId}):\n\n${statusNote}\n\nPlease log in to review and respond:\n${APP_URL}/client#services\n\nCorporate Mart • Legal & Compliance Services`;
    emailHtml = buildEmailTemplate({
      heading: 'Compliance Filing Update',
      title: `Action Required on Case ${caseId}`,
      bodyHtml: `
        <p>Dear <strong>${directorName}</strong>,</p>
        <p>There is an update requiring your attention regarding your <strong>${serviceName}</strong> application.</p>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px; margin:16px 0; color:#991b1b;">
          <strong>Status Note from Operations:</strong><br>
          ${statusNote}
        </div>
        <p>Please log in to your Client Portal to review details, provide missing information, or contact your operations manager.</p>
      `,
      buttonText: 'Open Client Portal & Review',
      buttonUrl: `${APP_URL}/client#services`,
      note: 'Please respond promptly to avoid delays with government department timelines.'
    });
  }

  // -------------------------------------------------------------
  // EVENT 3: SUPPORT QUERY / TICKET REPLIED
  // -------------------------------------------------------------
  else if (eventType === 'ticket_reply') {
    const subject = data.subject || 'Support Ticket';
    const message = data.message || '';
    const staffName = data.staffName || 'Operations Staff';
    const ticketId = data.ticketId || '';

    title = `💬 Message on Ticket #${ticketId}`;
    pushBody = `${staffName}: "${message.slice(0, 90)}${message.length > 90 ? '...' : ''}"`;
    pushUrl = '/client#support';

    emailSubject = `💬 Response to Ticket #${ticketId}: ${subject}`;
    emailText = `Dear ${directorName},\n\n${staffName} from Corporate Mart has replied to your query (${subject}):\n\n"${message}"\n\nReply in portal:\n${APP_URL}/client#support\n\nCorporate Mart Support`;
    emailHtml = buildEmailTemplate({
      heading: 'Support Desk Update',
      title: `Response to: ${subject}`,
      bodyHtml: `
        <p>Dear <strong>${directorName}</strong>,</p>
        <p><strong>${staffName}</strong> from Corporate Mart operations has replied to your query:</p>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px; margin:16px 0; color:#1e3a8a;">
          <em>"${message}"</em>
        </div>
        <p>You can view the full conversation and reply anytime in your Client Portal.</p>
      `,
      buttonText: 'Reply in Client Portal',
      buttonUrl: `${APP_URL}/client#support`,
      note: `Ticket #${ticketId} • Category: ${data.category || 'General'}`
    });
  }

  // -------------------------------------------------------------
  // DISPATCH 1: EMAIL NOTIFICATION
  // -------------------------------------------------------------
  let emailSent = false;
  if (client.email) {
    if (transporter) {
      try {
        await transporter.sendMail({
          from: senderEmail,
          to: client.email,
          replyTo: SMTP_USER,
          subject: emailSubject,
          text: emailText,
          html: emailHtml
        });
        emailSent = true;
        console.log(`✉️ [EMAIL] Alert sent to ${client.email} (${emailSubject})`);
      } catch (err) {
        console.warn(`⚠️ [EMAIL] Failed sending email to ${client.email}:`, err.message);
      }
    } else {
      // Test / Console Mock Delivery (no SMTP credentials yet)
      console.log(`✉️ [EMAIL PREVIEW] Simulated email to: ${client.email}`);
      console.log(`   Subject: ${emailSubject}`);
      console.log(`   Action URL: ${pushUrl}`);
      emailSent = true;
    }
  }

  // -------------------------------------------------------------
  // DISPATCH 2: IN-PHONE WEB PUSH NOTIFICATION
  // -------------------------------------------------------------
  let pushSentCount = 0;
  const subscriptions = Array.isArray(client.pushSubscriptions) ? client.pushSubscriptions : [];

  if (isPushConfigured && subscriptions.length > 0) {
    const payload = JSON.stringify({
      title,
      body: pushBody,
      icon: '/icons/Your_paragraph_text__8_-removebg-preview.png',
      badge: '/icons/Your_paragraph_text__8_-removebg-preview.png',
      url: pushUrl,
      tag: `cm-${eventType}-${Date.now()}`
    });

    const activeSubs = [];
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        pushSentCount++;
        activeSubs.push(sub);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log('ℹ️ Removing expired push subscription for client:', client.id);
        } else {
          console.warn('⚠️ Web Push delivery error:', err.message);
          activeSubs.push(sub);
        }
      }
    }

    client.pushSubscriptions = activeSubs;
    console.log(`📱 [PUSH] Delivered ${pushSentCount} in-phone alerts for client ${client.name} (${title})`);
  } else if (!isPushConfigured) {
    console.log('ℹ️ [PUSH] VAPID keys not configured; in-phone push skipped.');
  } else {
    console.log(`ℹ️ [PUSH] No active push devices registered for client ${client.name} yet.`);
  }

  return {
    success: true,
    emailSent,
    pushSentCount
  };
}

/**
 * Send 6-digit Password Reset OTP Email
 */
async function sendPasswordResetOtpEmail({ email, name, otp }) {
  const subject = `🔒 Corporate Mart Password Reset OTP: ${otp}`;
  const text = `Hello ${name || 'User'},\n\nYour one-time password verification code to reset your Corporate Mart account password is:\n\n${otp}\n\nThis verification code is valid for 15 minutes. If you did not request this password reset, please disregard this email.\n\nCorporate Mart Security Team`;

  const html = buildEmailTemplate({
    heading: 'Account Security Verification',
    title: 'Password Reset Verification Code',
    bodyHtml: `
      <p>Hello <strong>${name || 'User'}</strong>,</p>
      <p>We received a request to reset the password for your Corporate Mart account (<code>${email}</code>).</p>
      <div style="background:#f0f9ff; border:2px dashed #0284c7; border-radius:10px; padding:24px; text-align:center; margin:24px 0;">
        <span style="font-size:13px; color:#0369a1; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Your 6-Digit Reset Code</span>
        <div style="font-size:36px; font-weight:800; letter-spacing:8px; color:#0284c7; margin-top:8px;">${otp}</div>
        <span style="font-size:12px; color:#64748b; display:block; margin-top:8px;">Valid for 15 minutes only</span>
      </div>
      <p style="font-size:13px; color:#64748b;">If you did not initiate this request, your account is safe and no changes have been made.</p>
    `,
    note: 'For security reasons, never share this one-time code with anyone, including Corporate Mart staff.'
  });

  if (transporter) {
    try {
      await transporter.sendMail({
        from: senderEmail,
        to: email,
        replyTo: SMTP_USER,
        subject,
        text,
        html
      });
      console.log(`✉️ [EMAIL] Password reset OTP sent to ${email}`);
      return true;
    } catch (err) {
      console.warn(`⚠️ [EMAIL] Failed sending OTP email to ${email}:`, err.message);
      return false;
    }
  } else {
    console.log(`✉️ [EMAIL PREVIEW] Password reset OTP for ${email}: ${otp}`);
    return true;
  }
}

/**
 * Send Password Changed Confirmation Email
 */
async function sendPasswordChangedConfirmationEmail({ email, name }) {
  const subject = `✅ Corporate Mart: Your password was successfully updated`;
  const text = `Hello ${name || 'User'},\n\nThis is a confirmation that your Corporate Mart account password was updated successfully.\n\nIf you did not perform this change, please contact us immediately at contact@corporatemart.in.\n\nCorporate Mart Security Team`;

  const html = buildEmailTemplate({
    heading: 'Account Security Alert',
    title: 'Password Changed Successfully',
    bodyHtml: `
      <p>Hello <strong>${name || 'User'}</strong>,</p>
      <p>Your password for Corporate Mart has been successfully updated.</p>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:16px; margin:16px 0; color:#166534;">
        ✅ Security update confirmed on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.
      </div>
      <p>You can now log in using your new password across your devices.</p>
    `,
    buttonText: 'Open Login Page',
    buttonUrl: `${APP_URL}/client`,
    note: 'If you did not request or make this change, please contact support immediately at contact@corporatemart.in.'
  });

  if (transporter) {
    try {
      await transporter.sendMail({
        from: senderEmail,
        to: email,
        replyTo: SMTP_USER,
        subject,
        text,
        html
      });
      console.log(`✉️ [EMAIL] Password change confirmation sent to ${email}`);
      return true;
    } catch (err) {
      console.warn(`⚠️ [EMAIL] Failed sending password change confirmation to ${email}:`, err.message);
      return false;
    }
  } else {
    console.log(`✉️ [EMAIL PREVIEW] Password change confirmation for ${email}`);
    return true;
  }
}

module.exports = {
  notifyClient,
  sendPasswordResetOtpEmail,
  sendPasswordChangedConfirmationEmail,
  VAPID_PUBLIC_KEY
};
