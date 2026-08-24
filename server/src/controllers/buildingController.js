const { Op } = require('sequelize');
const { Building } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = {};
  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }
  const buildings = await Building.findAll({ where, order: [['name', 'ASC']] });
  return res.json({ success: true, data: buildings });
});

const getOne = asyncHandler(async (req, res) => {
  const building = await Building.findByPk(req.params.id);
  if (!building) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  return res.json({ success: true, data: building });
});

const create = asyncHandler(async (req, res) => {
  const building = await Building.create({ name: req.body.name });
  return res.status(201).json({ success: true, data: building });
});

const update = asyncHandler(async (req, res) => {
  const building = await Building.findByPk(req.params.id);
  if (!building) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await building.update({ name: req.body.name });
  return res.json({ success: true, data: building });
});

const remove = asyncHandler(async (req, res) => {
  const building = await Building.findByPk(req.params.id);
  if (!building) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await building.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

module.exports = { list, getOne, create, update, remove };
