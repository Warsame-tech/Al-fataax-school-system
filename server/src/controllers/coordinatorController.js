const { Op } = require('sequelize');
const { Coordinator, Building } = require('../models');
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
  const coordinators = await Coordinator.findAll({ where, include, order: [['name', 'ASC']] });
  return res.json({ success: true, data: coordinators });
});

const getOne = asyncHandler(async (req, res) => {
  const coordinator = await Coordinator.findByPk(req.params.id, { include });
  if (!coordinator) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  return res.json({ success: true, data: coordinator });
});

const create = asyncHandler(async (req, res) => {
  const coordinator = await Coordinator.create({
    name: req.body.name,
    buildingId: Number(req.body.buildingId),
  });
  return res.status(201).json({ success: true, data: coordinator });
});

const update = asyncHandler(async (req, res) => {
  const coordinator = await Coordinator.findByPk(req.params.id);
  if (!coordinator) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await coordinator.update({
    name: req.body.name,
    buildingId: Number(req.body.buildingId),
  });
  return res.json({ success: true, data: coordinator });
});

const remove = asyncHandler(async (req, res) => {
  const coordinator = await Coordinator.findByPk(req.params.id);
  if (!coordinator) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await coordinator.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

module.exports = { list, getOne, create, update, remove };
