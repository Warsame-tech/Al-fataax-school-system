const { Op } = require('sequelize');
const { Building } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ownBuildingId } = require('../utils/scoping');

const list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = {};
  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }
  const buildings = await Building.findAll({ where, order: [['name', 'ASC']] });
  return res.json({ success: true, data: buildings });
});

// A coordinator (GUDOOMIYE KUXIGEEN) may only ever fetch their own assigned
// masjid this way — used by the Student Registration form to populate a
// locked, single-option Masjid dropdown. Any other id is a 403, not just a
// hidden UI affordance, so this can't be used to enumerate other masjids'
// names via a direct API call either.
const getOne = asyncHandler(async (req, res) => {
  const building = await Building.findByPk(req.params.id);
  if (!building) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const forcedBuildingId = ownBuildingId(req.user);
  if (forcedBuildingId && building.id !== forcedBuildingId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
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
  const payload = { name: req.body.name };
  if (req.body.resultsVisible !== undefined) {
    payload.resultsVisible = req.body.resultsVisible;
  }
  await building.update(payload);
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
