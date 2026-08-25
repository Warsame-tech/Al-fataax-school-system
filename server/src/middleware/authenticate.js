const { verifyToken } = require('../utils/jwt');
const env = require('../config/env');

// Verifies the session token and attaches req.user — nothing more. This
// deliberately does NOT extend/re-sign the token on every request: if it
// did, background/auto-refresh requests (which fire on their own timer, not
// because of real user activity) would silently keep the session alive
// forever, defeating the inactivity timeout. The only place a session gets
// extended is POST /api/auth/heartbeat (see authController.heartbeat),
// which the frontend calls solely in response to genuine mouse/keyboard/
// touch/click activity. That makes JWT_EXPIRES_IN (server/.env) the real,
// server-enforced idle timeout: once that long passes with no heartbeat,
// the token's own `exp` claim fails verification here regardless of what
// the client sends or how its JS has been tampered with.
module.exports = function authenticate(req, res, next) {
  const token = req.cookies ? req.cookies[env.cookieName] : undefined;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
};
