const { verifyToken, signToken } = require('../utils/jwt');
const { getCookieOptions } = require('../utils/cookieOptions');
const env = require('../config/env');

// Sliding session: every authenticated request re-issues the token with a
// fresh expiry, so the cookie effectively expires N minutes after the LAST
// request rather than at a fixed time from login. A user actively using the
// system never gets logged out; one who walks away gets logged out (server-
// side, not just via the frontend idle timer) once JWT_EXPIRES_IN elapses
// with no requests.
module.exports = function authenticate(req, res, next) {
  const token = req.cookies ? req.cookies[env.cookieName] : undefined;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;

    const { iat, exp, ...claims } = payload; // eslint-disable-line no-unused-vars
    const refreshed = signToken(claims);
    res.cookie(env.cookieName, refreshed, getCookieOptions());

    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
};
