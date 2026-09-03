const { Op } = require('sequelize');
const { sequelize, Student, Building, Class, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ownBuildingId } = require('../utils/scoping');

const STUDENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

const include = [
  { model: Building, attributes: ['id', 'name'] },
  { model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] } },
];

// Coordinators may only ever act within their own masjid (route-level
// authorizeRoles already excludes students from this controller entirely,
// so in practice this only ever returns non-null for coordinator).
// Admins are unrestricted.
function coordinatorBuildingId(req) {
  return ownBuildingId(req.user);
}

const list = asyncHandler(async (req, res) => {
  const { search, buildingId, classId, gender } = req.query;
  const where = {};
  if (search) {
    const term = String(search).trim();
    where[Op.or] = [
      { id: { [Op.like]: `%${term}%` } },
      { name: { [Op.like]: `%${term}%` } },
    ];
  }
  if (gender) where.gender = gender;
  const forcedBuildingId = coordinatorBuildingId(req);
  if (forcedBuildingId) {
    where.buildingId = forcedBuildingId;
  } else if (buildingId) {
    where.buildingId = Number(buildingId);
  }

  const stageInclude = classId
    ? [{ model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] }, where: { id: Number(classId) }, required: true }]
    : [include[1]];

  const students = await Student.findAll({
    where,
    include: [include[0], ...stageInclude],
    order: [['name', 'ASC']],
  });
  return res.json({ success: true, data: students });
});

const getOne = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, { include });
  if (!student) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const forcedBuildingId = coordinatorBuildingId(req);
  if (forcedBuildingId && student.buildingId !== forcedBuildingId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return res.json({ success: true, data: student });
});

const create = asyncHandler(async (req, res) => {
  const id = String(req.body.id || '').trim();
  if (!id || id.length < 3 || id.length > 30 || !STUDENT_ID_PATTERN.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Student ID must be 3-30 characters and may only contain letters, numbers, and hyphens.',
    });
  }

  const existing = await Student.findByPk(id);
  if (existing) {
    return res.status(409).json({ success: false, message: 'This Student ID is already in use.' });
  }

  const forcedBuildingId = coordinatorBuildingId(req);
  const buildingId = forcedBuildingId || Number(req.body.buildingId);
  const student = await Student.create({
    id,
    name: req.body.name,
    gender: req.body.gender,
    buildingId,
  });
  return res.status(201).json({ success: true, data: student });
});

const update = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const forcedBuildingId = coordinatorBuildingId(req);
  if (forcedBuildingId && student.buildingId !== forcedBuildingId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  // Student ID is intentionally not editable here — it's a real primary
  // key with dependent Results/User rows, so renaming it goes through the
  // dedicated `rename` transaction below instead of a plain field update.
  await student.update({
    name: req.body.name,
    gender: req.body.gender,
    buildingId: forcedBuildingId || Number(req.body.buildingId),
  });
  return res.json({ success: true, data: student });
});

// Renames a Student's ID, cascading the change to every dependent row in
// one transaction so nothing is ever left pointing at the old ID.
const rename = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const forcedBuildingId = coordinatorBuildingId(req);
  if (forcedBuildingId && student.buildingId !== forcedBuildingId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const newId = String(req.body.newId || '').trim();
  if (!newId || newId.length < 3 || newId.length > 30 || !STUDENT_ID_PATTERN.test(newId)) {
    return res.status(400).json({
      success: false,
      message: 'New Student ID must be 3-30 characters and may only contain letters, numbers, and hyphens.',
    });
  }
  if (newId === student.id) {
    return res.json({ success: true, data: student });
  }

  const existing = await Student.findByPk(newId);
  if (existing) {
    return res.status(409).json({ success: false, message: 'This Student ID is already in use.' });
  }

  const oldId = student.id;
  await sequelize.transaction(async (t) => {
    // Results.studentId, Users.studentId, and student_stage_registrations.
    // student_id all carry ON UPDATE CASCADE (see
    // scripts/006-add-on-update-cascade-for-student-fks.js), so this single
    // statement is enough to move every dependent row to the new ID at the
    // database level.
    await sequelize.query('UPDATE Students SET id = :newId WHERE id = :oldId', {
      replacements: { newId, oldId },
      transaction: t,
    });
    // The cascade above only updates the studentId FK column — it can't
    // touch User.username, an unrelated column with no DB-level tie to it.
    // A student's username must always equal their Student ID (enforced at
    // create/update time in this same controller's sibling), so keep that
    // invariant true here too.
    await User.update({ username: newId }, { where: { studentId: newId }, transaction: t });
  });

  const renamed = await Student.findByPk(newId, { include });
  return res.json({ success: true, data: renamed });
});

const remove = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const forcedBuildingId = coordinatorBuildingId(req);
  if (forcedBuildingId && student.buildingId !== forcedBuildingId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  await student.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

module.exports = { list, getOne, create, update, rename, remove, coordinatorBuildingId };
