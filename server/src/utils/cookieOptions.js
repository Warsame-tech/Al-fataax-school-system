const env = require('../config/env');

// Shared by login and every place that re-issues the cookie (currently
// POST /api/auth/heartbeat — see authController.js), so they never drift
// out of sync.
//
// Deliberately no maxAge/expires: this makes it a true browser *session*
// cookie, discarded when the browser itself closes, rather than a
// persistent one that would silently keep a user logged in across closing
// and reopening the window. The JWT's own `exp` claim (env.jwt.expiresIn)
// still independently enforces the idle timeout while the browser stays
// open — that mechanism is unrelated to this cookie's lifetime and doesn't
// need maxAge to work (see authenticate.js).
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
  };
}

module.exports = { getCookieOptions };
