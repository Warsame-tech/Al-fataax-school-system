const bcrypt = require('bcryptjs');
const { User, Coordinator } = require('../models');
const { signToken } = require('../utils/jwt');
const { getCookieOptions } = require('../utils/cookieOptions');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    userType: user.userType,
    studentId: user.studentId,
    coordinatorId: user.coordinatorId,
  };
}

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const user = await User.scope('withPassword').findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  let buildingId = null;
  if (user.userType === 'coordinator' && user.coordinatorId) {
    const coordinator = await Coordinator.findByPk(user.coordinatorId);
    buildingId = coordinator ? coordinator.buildingId : null;
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    userType: user.userType,
    studentId: user.studentId,
    coordinatorId: user.coordinatorId,
    buildingId,
  };

  const token = signToken(tokenPayload);
  res.cookie(env.cookieName, token, getCookieOptions());

  // Must match `me`'s shape below — a coordinator's buildingId is needed
  // immediately (e.g. Student Registration's locked Masjid field) without
  // waiting for a page refresh to re-trigger the /auth/me fetch.
  return res.json({ success: true, data: { ...toPublicUser(user), buildingId } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.cookieName, getCookieOptions());
  return res.json({ success: true, message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  return res.json({ success: true, data: { ...toPublicUser(user), buildingId: req.user.buildingId } });
});

// The ONLY endpoint that extends a session. The frontend calls this in
// response to real user activity (throttled well inside JWT_EXPIRES_IN),
// never from background/auto-refresh requests — see authenticate.js for why
// that split matters. Requires an already-valid, non-expired token, so it
// cannot itself be used to resurrect a session that has already timed out.
const heartbeat = asyncHandler(async (req, res) => {
  const { iat, exp, ...claims } = req.user; // eslint-disable-line no-unused-vars
  const refreshed = signToken(claims);
  res.cookie(env.cookieName, refreshed, getCookieOptions());
  return res.json({ success: true });
});

module.exports = { login, logout, me, heartbeat };
