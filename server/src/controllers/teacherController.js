const { Op } = require('sequelize');
const { Teacher, Building } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const include = [{ model: Building, attributes: ['id', 'name'] }];

const list = asyncHandler(async (req, res) => {
  const { search, buildingId } = req.query;
  const where = {};
  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }
  if (buildingId) {
    where.buildingId = Number(buildingId);
  }
  const teachers = await Teacher.findAll({ where, include, order: [['name', 'ASC']] });
  return res.json({ success: true, data: teachers });
});

const getOne = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByPk(req.params.id, { include });
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  return res.json({ success: true, data: teacher });
});

const create = asyncHandler(async (req, res) => {
  const teacher = await Teacher.create({
    name: req.body.name,
    buildingId: Number(req.body.buildingId),
  });
  return res.status(201).json({ success: true, data: teacher });
});

const update = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByPk(req.params.id);
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await teacher.update({
    name: req.body.name,
    buildingId: Number(req.body.buildingId),
  });
  return res.json({ success: true, data: teacher });
});

const remove = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByPk(req.params.id);
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await teacher.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

module.exports = { list, getOne, create, update, remove };
