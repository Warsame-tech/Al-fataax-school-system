const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sequelize, User, PasswordResetOtp } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendOtpEmail } = require('../utils/mailer');
const env = require('../config/env');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_SALT_ROUNDS = 10;
const PASSWORD_SALT_ROUNDS = 12;
const RESET_TOKEN_PURPOSE = 'password-reset';
const RESET_TOKEN_TTL = '10m';

function generateOtp() {
  // Cryptographically secure, uniform over 000000-999999 (crypto.randomInt
  // avoids the modulo bias a plain Math.random()-based approach would have).
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Case-insensitive lookup, scoped to admin accounts only — this recovery
// flow exists solely for the Admin account (per the feature spec), so even
// if some other user type were ever given an email, it could never reach
// this flow. Collation-independent (LOWER() on both sides).
function findAdminByEmail(email) {
  return User.findOne({
    where: {
      userType: 'admin',
      [Op.and]: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), email.toLowerCase()),
    },
  });
}

// Public, unauthenticated endpoint that returns the admin's registered
// recovery email so the Forgot Password page can pre-fill it — an explicit
// convenience tradeoff the admin asked for, at the cost of the email being
// visible to anyone who opens that page (normally this app avoids exposing
// it before the visitor proves they know it). Never returns anything else
// about the account.
const getAdminEmail = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ where: { userType: 'admin' }, order: [['id', 'ASC']] });
  return res.json({ success: true, data: { email: admin?.email || null } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim();
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = await findAdminByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'No admin account is registered with that email address.' });
  }

  // Cooldown before a fresh code can be issued (initial request or an
  // explicit Resend) — an IP-level limiter alone (see rateLimiter.js) still
  // lets a single request loop hammer one specific account.
  const pending = await PasswordResetOtp.findOne({
    where: { userId: user.id, passwordResetAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (pending) {
    const elapsed = Date.now() - pending.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
        retryAfterSeconds,
      });
    }
    // Cooldown elapsed — this request supersedes it, only one pending code at a time.
    await pending.destroy();
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, OTP_SALT_ROUNDS);
  await PasswordResetOtp.create({
    userId: user.id,
    otpHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  let delivered = true;
  try {
    ({ delivered } = await sendOtpEmail(user.email, otp));
  } catch (err) {
    // Never forward the raw SMTP/nodemailer error to the client — it can
    // include host/auth details. Log it server-side for diagnosis instead.
    console.error('Failed to send password reset OTP email:', err);
    return res.status(500).json({ success: false, message: 'Failed to send the verification email. Please try again later.' });
  }

  if (delivered) {
    return res.json({ success: true, message: 'A verification code has been sent to your email.' });
  }

  // Dev-mode fallback: SMTP isn't configured, so the OTP was only logged
  // server-side (see mailer.js) — surface it here so the flow is still
  // testable end-to-end, but never outside development.
  const payload = {
    success: true,
    message: 'Email is not configured yet, so the code could not be sent — showing it here for testing.',
  };
  if (env.nodeEnv !== 'production') {
    payload.devOtp = otp;
  }
  return res.json(payload);
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim();
  const otp = String(req.body.otp || '').trim();
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
  }

  const user = await findAdminByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'No admin account is registered with that email address.' });
  }

  const record = await PasswordResetOtp.findOne({
    where: { userId: user.id, passwordResetAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'No verification code is pending for this account. Please request a new one.',
    });
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await record.destroy();
    return res.status(400).json({ success: false, message: 'This verification code has expired. Please request a new one.' });
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await record.destroy();
    return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new verification code.' });
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    if (record.attempts >= MAX_ATTEMPTS) {
      await record.destroy();
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new verification code.' });
    }
    const remaining = MAX_ATTEMPTS - record.attempts;
    return res.status(400).json({ success: false, message: `Incorrect verification code. ${remaining} attempt(s) remaining.` });
  }

  record.verified = true;
  await record.save();

  // A short-lived, single-purpose token — the only credential the next
  // step (actually changing the password) accepts, so that step can never
  // be reached by skipping OTP verification.
  const resetToken = jwt.sign(
    { purpose: RESET_TOKEN_PURPOSE, otpId: record.id, userId: user.id },
    env.jwt.secret,
    { expiresIn: RESET_TOKEN_TTL },
  );

  return res.json({ success: true, data: { resetToken } });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.body;
  const newPassword = String(req.body.newPassword || '');

  if (!resetToken || !newPassword) {
    return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, env.jwt.secret);
  } catch {
    return res.status(400).json({ success: false, message: 'This reset session is invalid or has expired. Please start over.' });
  }
  if (decoded.purpose !== RESET_TOKEN_PURPOSE) {
    return res.status(400).json({ success: false, message: 'This reset session is invalid.' });
  }

  const record = await PasswordResetOtp.findByPk(decoded.otpId);
  if (!record || record.userId !== decoded.userId || !record.verified || record.passwordResetAt) {
    return res.status(400).json({
      success: false,
      message: 'This reset session is invalid or has already been used. Please start over.',
    });
  }

  const user = await User.findByPk(decoded.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  await user.update({ passwordHash });
  record.passwordResetAt = new Date();
  await record.save();

  return res.json({ success: true, message: 'Your password has been reset successfully.' });
});

module.exports = { getAdminEmail, forgotPassword, verifyResetOtp, resetPassword };
