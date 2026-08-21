import nodemailer from "nodemailer";
import { randomInt } from "node:crypto";
import { SMTP_SERVICE, SMTP_EMAIL, SMTP_APP_PASS } from "../config/config.js";

const smtpConfigured = Boolean(SMTP_EMAIL && SMTP_APP_PASS);

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: SMTP_SERVICE || "Gmail",
      auth: { user: SMTP_EMAIL, pass: SMTP_APP_PASS },
    });
  }
  return transporter;
}

/**
 * Generate a cryptographically-random 6-digit OTP.
 */
export function generateOtp() {
  return String(randomInt(100000, 1000000));
}

/**
 * Send the password-reset OTP email via Nodemailer.
 * If SMTP is not configured (e.g. local dev), the OTP is logged to the console
 * instead of failing the request.
 */
export async function sendOtpEmail(toEmail, otp) {
  if (!smtpConfigured) {
    console.log(`[DEV] Password reset OTP for ${toEmail}: ${otp}`);
    return;
  }
  await getTransporter().sendMail({
    from: `"Vendio" <${SMTP_EMAIL}>`,
    to: toEmail,
    subject: "Vendio — Your Password Reset OTP",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#2563EB;margin:0 0 8px;">Vendio</h2>
        <p style="color:#1F2937;">You requested to reset your password. Use the OTP below:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#059669;margin:16px 0;">${otp}</p>
        <p style="color:#6B7280;font-size:13px;">This OTP expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
