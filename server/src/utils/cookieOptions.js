const env = require('../config/env');

// Shared by login (sets the cookie) and the sliding-session refresh in
// authenticate.js (re-sets it on every authenticated request), so the two
// never drift out of sync.
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: env.jwt.expiresInMs,
  };
}

module.exports = { getCookieOptions };
