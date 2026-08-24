const { Op, QueryTypes } = require('sequelize');
const { sequelize, Subject, Fan } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const include = [{ model: Fan, attributes: ['id', 'name_ar'] }];

const list = asyncHandler(async (req, res) => {
  const { search, fanId, unassignedOnly, excludeStageId } = req.query;
  const where = {};
  if (search) {
    where.name_ar = { [Op.like]: `%${search}%` };
  }
  if (fanId) {
    where.fanId = Number(fanId);
  }

  let subjects = await Subject.findAll({ where, include, order: [['name_ar', 'ASC']] });

  // A book already assigned to a different Educational Stage must not appear
  // as an available option when registering/editing another stage.
  if (unassignedOnly === 'true' || unassignedOnly === '1') {
    const assignedRows = await sequelize.query(
      `SELECT DISTINCT book_id FROM stage_religious_books WHERE stage_id != :excludeStageId`,
      { replacements: { excludeStageId: Number(excludeStageId) || 0 }, type: QueryTypes.SELECT }
    );
    const assignedIds = new Set(assignedRows.map((r) => r.book_id));
    subjects = subjects.filter((s) => !assignedIds.has(s.id));
  }

  return res.json({ success: true, data: subjects });
});

const getOne = asyncHandler(async (req, res) => {
  const subject = await Subject.findByPk(req.params.id, { include });
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  return res.json({ success: true, data: subject });
});

const create = asyncHandler(async (req, res) => {
  const fanId = Number(req.body.fanId);
  const fan = await Fan.findByPk(fanId);
  if (!fan) {
    return res.status(404).json({ success: false, message: 'Fan not found' });
  }
  const subject = await Subject.create({ name_ar: req.body.name_ar, fanId });
  return res.status(201).json({ success: true, data: subject });
});

const update = asyncHandler(async (req, res) => {
  const subject = await Subject.findByPk(req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const fanId = Number(req.body.fanId);
  const fan = await Fan.findByPk(fanId);
  if (!fan) {
    return res.status(404).json({ success: false, message: 'Fan not found' });
  }
  await subject.update({ name_ar: req.body.name_ar, fanId });
  return res.json({ success: true, data: subject });
});

const remove = asyncHandler(async (req, res) => {
  const subject = await Subject.findByPk(req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await subject.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

module.exports = { list, getOne, create, update, remove };
