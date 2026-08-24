const { Op } = require('sequelize');
const { Student, Building, Class } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ownBuildingId } = require('../utils/scoping');

const include = [
  { model: Building, attributes: ['id', 'name'] },
  { model: Class, attributes: ['id', 'name_ar'] },
];

// Coordinators may only ever act within their own masjid (route-level
// authorizeRoles already excludes teacher/student from this controller
// entirely, so in practice this only ever returns non-null for coordinator).
// Admins are unrestricted.
function coordinatorBuildingId(req) {
  return ownBuildingId(req.user);
}

const list = asyncHandler(async (req, res) => {
  const { search, buildingId, classId } = req.query;
  const where = {};
  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }
  const forcedBuildingId = coordinatorBuildingId(req);
  if (forcedBuildingId) {
    where.buildingId = forcedBuildingId;
  } else if (buildingId) {
    where.buildingId = Number(buildingId);
  }
  if (classId) {
    where.classId = Number(classId);
  }
  const students = await Student.findAll({ where, include, order: [['name', 'ASC']] });
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
  const forcedBuildingId = coordinatorBuildingId(req);
  const buildingId = forcedBuildingId || Number(req.body.buildingId);
  const student = await Student.create({
    name: req.body.name,
    gender: req.body.gender,
    buildingId,
    classId: Number(req.body.classId),
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
  await student.update({
    name: req.body.name,
    gender: req.body.gender,
    buildingId: forcedBuildingId || Number(req.body.buildingId),
    classId: Number(req.body.classId),
  });
  return res.json({ success: true, data: student });
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

module.exports = { list, getOne, create, update, remove };
