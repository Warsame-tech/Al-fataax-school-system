const { Op } = require('sequelize');
const { Fan } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = {};
  if (search) {
    where.name_ar = { [Op.like]: `%${search}%` };
  }
  const fans = await Fan.findAll({ where, order: [['name_ar', 'ASC']] });
  return res.json({ success: true, data: fans });
});

const getOne = asyncHandler(async (req, res) => {
  const fan = await Fan.findByPk(req.params.id);
  if (!fan) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  return res.json({ success: true, data: fan });
});

const create = asyncHandler(async (req, res) => {
  const fan = await Fan.create({ name_ar: req.body.name_ar });
  return res.status(201).json({ success: true, data: fan });
});

const update = asyncHandler(async (req, res) => {
  const fan = await Fan.findByPk(req.params.id);
  if (!fan) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await fan.update({ name_ar: req.body.name_ar });
  return res.json({ success: true, data: fan });
});

const remove = asyncHandler(async (req, res) => {
  const fan = await Fan.findByPk(req.params.id);
  if (!fan) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await fan.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

module.exports = { list, getOne, create, update, remove };
