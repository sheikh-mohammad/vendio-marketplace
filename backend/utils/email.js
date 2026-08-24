import nodemailer from "nodemailer";
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

export function generateOtp() {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

/**
 * Branded, email-client-safe HTML template for password-reset OTPs.
 * Uses nested tables + inline styles (no external images) so it renders
 * correctly in Gmail, Outlook, Apple Mail and mobile clients.
 */
export function otpEmailHtml(otp) {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:0; background-color:#EEF2F7;">
  <div style="display:none; max-height:0; overflow:hidden;">Your Vendio verification code is ${otp} &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF2F7; padding:32px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

          <!-- Logo lockup -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" height="44" align="center" valign="middle" bgcolor="#2563EB" style="width:44px; height:44px; border-radius:12px; color:#FFFFFF; font-size:24px; font-weight:bold; line-height:44px; text-align:center;">
                          &#10003;
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding-left:10px;">
                    <span style="font-size:22px; font-weight:700; color:#111827;">Vendio</span>
                    <span style="font-size:13px; font-weight:600; color:#6B7280;">&nbsp;Marketplace</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td bgcolor="#FFFFFF" style="border-radius:16px; border:1px solid #E5E7EB;">

              <!-- Accent top bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td height="6" bgcolor="#2563EB" style="height:6px; line-height:6px; font-size:0; border-radius:16px 16px 0 0;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:36px 40px 40px;">

                <!-- Heading -->
                <tr>
                  <td style="font-size:22px; font-weight:700; color:#111827; padding-bottom:8px;">
                    Password reset verification
                  </td>
                </tr>

                <!-- Copy -->
                <tr>
                  <td style="font-size:15px; line-height:24px; color:#4B5563; padding-bottom:28px;">
                    Hi there,<br/>
                    Use the one-time code below to reset your Vendio account password.
                  </td>
                </tr>

                <!-- OTP block -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" bgcolor="#F0FDF4" style="background-color:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:22px 20px;">
                          <div style="color:#059669; font-size:13px; font-weight:600; letter-spacing:2px; padding-bottom:6px;">YOUR CODE</div>
                          <div style="color:#065F46; font-size:36px; font-weight:700; letter-spacing:12px; text-indent:12px; line-height:1.2;">${otp}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiry note -->
                <tr>
                  <td align="center" style="font-size:13px; color:#6B7280; padding-bottom:28px;">
                    This code expires in
                    <strong style="color:#374151;">10 minutes</strong>.
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #E5E7EB; padding-top:24px;">
                    <p style="margin:0 0 6px; font-size:14px; line-height:22px; color:#4B5563;">
                      Didn't request a reset?
                    </p>
                    <p style="margin:0; font-size:13px; line-height:21px; color:#9CA3AF;">
                      You can safely ignore this email — your password will stay unchanged and no one else can use this code.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 16px 8px; font-size:12px; line-height:18px; color:#9CA3AF;">
              Need help? Just reply to this email — we're happy to assist.<br/>
              &copy; ${year} Vendio Marketplace. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
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
    from: `"Vendio Marketplace" <${SMTP_EMAIL}>`,
    to: toEmail,
    subject: `${otp} is your Vendio password reset code`,
    text: `Your Vendio password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, you can safely ignore this email.`,
    html: otpEmailHtml(otp),
  });
}
