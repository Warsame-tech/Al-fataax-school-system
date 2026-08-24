const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Teacher, Student, Coordinator } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const SALT_ROUNDS = 12;

const include = [
  { model: Teacher, attributes: ['id', 'name'] },
  { model: Student, attributes: ['id', 'name'] },
  { model: Coordinator, attributes: ['id', 'name'] },
];

// Validates the userType <-> teacherId/studentId/coordinatorId linkage rule.
// Returns an error message string if invalid, or null if valid.
// `currentUserId` is excluded from the "already linked" check (used on update).
async function validateLinkage({ userType, teacherId, studentId, coordinatorId }, currentUserId = null) {
  if (userType === 'admin') {
    if (teacherId || studentId || coordinatorId) {
      return 'Admin users must not have a teacherId, studentId, or coordinatorId.';
    }
    return null;
  }

  if (userType === 'teacher') {
    if (studentId || coordinatorId) {
      return 'Teacher users must not have a studentId or coordinatorId.';
    }
    if (!teacherId) {
      return 'teacherId is required when userType is teacher.';
    }
    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) {
      return 'teacherId does not reference an existing Teacher.';
    }
    const existingLink = await User.findOne({ where: { teacherId } });
    if (existingLink && existingLink.id !== currentUserId) {
      return 'This Teacher is already linked to another User.';
    }
    return null;
  }

  if (userType === 'student') {
    if (teacherId || coordinatorId) {
      return 'Student users must not have a teacherId or coordinatorId.';
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
    if (teacherId || studentId) {
      return 'Coordinator users must not have a teacherId or studentId.';
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

  return 'Invalid userType.';
}

// The User model still has a required `name` column (used only internally /
// as a fallback display value). Rather than asking the admin to re-type a
// name that duplicates the linked Student/Teacher/Coordinator record, derive
// it automatically so there's a single source of truth for that person's name.
async function resolveName({ userType, teacherId, studentId, coordinatorId, username }) {
  if (userType === 'teacher') {
    const teacher = await Teacher.findByPk(teacherId);
    return teacher?.name || username;
  }
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
  const { username, password, userType } = req.body;
  const teacherId = req.body.teacherId != null ? Number(req.body.teacherId) : null;
  const studentId = req.body.studentId != null ? Number(req.body.studentId) : null;
  const coordinatorId = req.body.coordinatorId != null ? Number(req.body.coordinatorId) : null;

  const linkageError = await validateLinkage({ userType, teacherId, studentId, coordinatorId });
  if (linkageError) {
    return res.status(400).json({ success: false, message: linkageError });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const name = await resolveName({ userType, teacherId, studentId, coordinatorId, username });

  const user = await User.create({
    username,
    name,
    passwordHash,
    userType,
    teacherId: userType === 'teacher' ? teacherId : null,
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

  const { username, password, userType } = req.body;
  const teacherId = req.body.teacherId != null ? Number(req.body.teacherId) : null;
  const studentId = req.body.studentId != null ? Number(req.body.studentId) : null;
  const coordinatorId = req.body.coordinatorId != null ? Number(req.body.coordinatorId) : null;

  const linkageError = await validateLinkage({ userType, teacherId, studentId, coordinatorId }, user.id);
  if (linkageError) {
    return res.status(400).json({ success: false, message: linkageError });
  }

  const name = await resolveName({ userType, teacherId, studentId, coordinatorId, username });

  const updates = {
    username,
    name,
    userType,
    teacherId: userType === 'teacher' ? teacherId : null,
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
