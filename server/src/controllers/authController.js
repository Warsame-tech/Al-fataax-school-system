const bcrypt = require('bcryptjs');
const { User, Teacher, Coordinator } = require('../models');
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
    teacherId: user.teacherId,
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
  if (user.userType === 'teacher' && user.teacherId) {
    const teacher = await Teacher.findByPk(user.teacherId);
    buildingId = teacher ? teacher.buildingId : null;
  } else if (user.userType === 'coordinator' && user.coordinatorId) {
    const coordinator = await Coordinator.findByPk(user.coordinatorId);
    buildingId = coordinator ? coordinator.buildingId : null;
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    userType: user.userType,
    teacherId: user.teacherId,
    studentId: user.studentId,
    coordinatorId: user.coordinatorId,
    buildingId,
  };

  const token = signToken(tokenPayload);
  res.cookie(env.cookieName, token, getCookieOptions());

  return res.json({ success: true, data: toPublicUser(user) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.cookieName, { httpOnly: true, secure: env.nodeEnv === 'production', sameSite: 'lax' });
  return res.json({ success: true, message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  return res.json({ success: true, data: { ...toPublicUser(user), buildingId: req.user.buildingId } });
});

module.exports = { login, logout, me };
