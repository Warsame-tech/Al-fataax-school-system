const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

// Lazily created (not at module load) so the rest of the app still boots
// cleanly even if SMTP hasn't been configured yet.
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  return transporter;
}

// Returns { delivered: true } once actually emailed, or { delivered: false }
// when SMTP isn't configured — in which case the OTP is only logged
// server-side, and passwordResetController surfaces it in the API response
// as a dev-mode convenience (never in production; see env.nodeEnv there).
// This lets the whole Forgot Password flow be tested end-to-end before
// real Gmail credentials are filled into server/.env.
async function sendOtpEmail(to, otp) {
  const { host, user, pass } = env.smtp;
  if (!host || !user || !pass) {
    console.log(`[DEV MODE — SMTP not configured] OTP for ${to}: ${otp}`);
    return { delivered: false };
  }

  const t = getTransporter();
  await t.sendMail({
    from: env.smtp.from || env.smtp.user,
    to,
    subject: 'Al Fataax — Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #7a1f1f; margin-bottom: 4px;">Al Fataax</h2>
        <p style="margin-top: 0; color: #6b7280;">Education Management System</p>
        <p>Use the verification code below to reset your admin password. This code expires in <strong>10 minutes</strong> and can only be used once.</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 10px; text-align: center; background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
          ${otp}
        </p>
        <p style="color: #6b7280; font-size: 13px;">If you did not request a password reset, you can safely ignore this email — your password will not be changed.</p>
      </div>
    `,
  });
  return { delivered: true };
}

module.exports = { sendOtpEmail };
