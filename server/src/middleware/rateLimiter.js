const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

// Defense-in-depth on account writes (create user / change password). These
// are already admin-only, but a compromised or scripted admin session
// shouldn't be able to hammer account creation/password-reset unthrottled.
const accountWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many account changes. Please try again later.' },
});

// The frontend pings this at most once every ~15s while a user is
// continuously active (see client/src/config/session.js), so a generous
// per-minute budget still comfortably bounds a tampered/scripted client.
const heartbeatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many session requests. Please try again later.' },
});

// Forgot Password is unauthenticated by nature (that's the whole point),
// so without its own budget it's an open email-bombing / OTP-guessing
// endpoint. The OTP itself also has its own internal wrong-attempt limiter
// (see passwordResetController.js) — this is the outer, IP-level layer.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

module.exports = { loginLimiter, accountWriteLimiter, heartbeatLimiter, passwordResetLimiter };
