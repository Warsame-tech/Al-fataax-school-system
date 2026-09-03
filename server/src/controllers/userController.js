const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Student, Coordinator } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const SALT_ROUNDS = 12;

const include = [
  { model: Student, attributes: ['id', 'name'] },
  { model: Coordinator, attributes: ['id', 'name'] },
];

// Validates the userType <-> studentId/coordinatorId linkage rule.
// Returns an error message string if invalid, or null if valid.
// `currentUserId` is excluded from the "already linked" check (used on update).
async function validateLinkage({ userType, studentId, coordinatorId }, currentUserId = null) {
  if (userType === 'admin') {
    if (studentId || coordinatorId) {
      return 'Admin users must not have a studentId or coordinatorId.';
    }
    return null;
  }

  if (userType === 'student') {
    if (coordinatorId) {
      return 'Student users must not have a coordinatorId.';
    }
    if (!studentId) {
      return 'studentId is required when userType is student.';
    }
    const student = await Student.findByPk(studentId);
    if (!student) {
      return 'studentId does not reference an existing Student.';
    }
    const existingLink = await User.findOne({ where: { studentId } });
    if (existingLink && existingLink.id !== currentUserId) {
      return 'This Student is already linked to another User.';
    }
    return null;
  }

  if (userType === 'coordinator') {
    if (studentId) {
      return 'Coordinator users must not have a studentId.';
    }
    if (!coordinatorId) {
      return 'coordinatorId is required when userType is coordinator.';
    }
    const coordinator = await Coordinator.findByPk(coordinatorId);
    if (!coordinator) {
      return 'coordinatorId does not reference an existing Coordinator.';
    }
    const existingLink = await User.findOne({ where: { coordinatorId } });
    if (existingLink && existingLink.id !== currentUserId) {
      return 'This Coordinator is already linked to another User.';
    }
    return null;
  }

  if (userType === 'gudoomiye') {
    // Report-only role, same shape as admin: no directory-entry model, so
    // no xId FK is ever linked.
    if (studentId || coordinatorId) {
      return 'GUDOOMIYE users must not have a studentId or coordinatorId.';
    }
    return null;
  }

  return 'Invalid userType.';
}

// The User model still has a required `name` column (used only internally /
// as a fallback display value). Rather than asking the admin to re-type a
// name that duplicates the linked Student/Coordinator record, derive
// it automatically so there's a single source of truth for that person's name.
async function resolveName({ userType, studentId, coordinatorId, username }) {
  if (userType === 'student') {
    const student = await Student.findByPk(studentId);
    return student?.name || username;
  }
  if (userType === 'coordinator') {
    const coordinator = await Coordinator.findByPk(coordinatorId);
    return coordinator?.name || username;
  }
  return username;
}

const list = asyncHandler(async (req, res) => {
  const { search, userType } = req.query;
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { username: { [Op.like]: `%${search}%` } },
    ];
  }
  if (userType) {
    where.userType = userType;
  }
  const users = await User.findAll({ where, include, order: [['username', 'ASC']] });
  return res.json({ success: true, data: users });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, { include });
  if (!user) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  return res.json({ success: true, data: user });
});

const create = asyncHandler(async (req, res) => {
  const { password, userType } = req.body;
  const studentId = req.body.studentId || null;
  const coordinatorId = req.body.coordinatorId != null ? Number(req.body.coordinatorId) : null;

  const linkageError = await validateLinkage({ userType, studentId, coordinatorId });
  if (linkageError) {
    return res.status(400).json({ success: false, message: linkageError });
  }

  // A student's username is always the linked Student's own ID — never
  // trust the client-sent username for this type, so it can't be bypassed
  // via a direct API call (see client/src/pages/registrations/UsersPage.jsx
  // for the matching UX-only lock).
  const username = userType === 'student' ? studentId : req.body.username;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const name = await resolveName({ userType, studentId, coordinatorId, username });

  const email = req.body.email?.trim() || null;

  const user = await User.create({
    username,
    name,
    passwordHash,
    userType,
    email,
    studentId: userType === 'student' ? studentId : null,
    coordinatorId: userType === 'coordinator' ? coordinatorId : null,
  });

  const { passwordHash: _omit, ...publicUser } = user.toJSON();
  return res.status(201).json({ success: true, data: publicUser });
});

const update = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  const { password, userType } = req.body;
  const studentId = req.body.studentId || null;
  const coordinatorId = req.body.coordinatorId != null ? Number(req.body.coordinatorId) : null;

  const linkageError = await validateLinkage({ userType, studentId, coordinatorId }, user.id);
  if (linkageError) {
    return res.status(400).json({ success: false, message: linkageError });
  }

  const username = userType === 'student' ? studentId : req.body.username;
  const name = await resolveName({ userType, studentId, coordinatorId, username });

  const updates = {
    username,
    name,
    userType,
    email: req.body.email?.trim() || null,
    studentId: userType === 'student' ? studentId : null,
    coordinatorId: userType === 'coordinator' ? coordinatorId : null,
  };

  if (password) {
    updates.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  await user.update(updates);
  return res.json({ success: true, data: user });
});

const remove = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await user.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

module.exports = { list, getOne, create, update, remove };
