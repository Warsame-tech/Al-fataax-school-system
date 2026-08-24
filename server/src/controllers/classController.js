const { Op, QueryTypes } = require('sequelize');
const { sequelize, Class, Subject, Fan } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const include = [
  {
    model: Subject,
    attributes: ['id', 'name_ar'],
    through: { attributes: [] },
    include: [{ model: Fan, attributes: ['id', 'name_ar'] }],
  },
];

function parseBookIds(body) {
  const raw = body.bookIds;
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map(Number).filter((n) => !Number.isNaN(n));
}

// A Religious Book may only ever belong to one Educational Stage at a time.
// Returns the subset of bookIds that are already assigned to a DIFFERENT
// stage than excludeStageId (null/undefined on create, the stage's own id on update).
async function findAlreadyAssigned(bookIds, excludeStageId) {
  if (!bookIds.length) return [];
  const rows = await sequelize.query(
    `SELECT DISTINCT book_id FROM stage_religious_books WHERE book_id IN (:bookIds) AND stage_id != :excludeStageId`,
    {
      replacements: { bookIds, excludeStageId: excludeStageId || 0 },
      type: QueryTypes.SELECT,
    }
  );
  return rows.map((r) => r.book_id);
}

const list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = {};
  if (search) {
    where.name_ar = { [Op.like]: `%${search}%` };
  }
  const classes = await Class.findAll({ where, include, order: [['name_ar', 'ASC']] });
  return res.json({ success: true, data: classes });
});

const getOne = asyncHandler(async (req, res) => {
  const klass = await Class.findByPk(req.params.id, { include });
  if (!klass) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  return res.json({ success: true, data: klass });
});

const create = asyncHandler(async (req, res) => {
  const bookIds = parseBookIds(req.body);
  if (bookIds.length) {
    const taken = await findAlreadyAssigned(bookIds, null);
    if (taken.length) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected religious books are already assigned to another educational stage.',
      });
    }
  }
  const klass = await Class.create({ name_ar: req.body.name_ar });
  if (bookIds.length) {
    await klass.setSubjects(bookIds);
  }
  const withBooks = await Class.findByPk(klass.id, { include });
  return res.status(201).json({ success: true, data: withBooks });
});

const update = asyncHandler(async (req, res) => {
  const klass = await Class.findByPk(req.params.id);
  if (!klass) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  if (req.body.bookIds !== undefined) {
    const bookIds = parseBookIds(req.body);
    if (bookIds.length) {
      const taken = await findAlreadyAssigned(bookIds, klass.id);
      if (taken.length) {
        return res.status(409).json({
          success: false,
          message: 'One or more selected religious books are already assigned to another educational stage.',
        });
      }
    }
    await klass.setSubjects(bookIds);
  }
  await klass.update({ name_ar: req.body.name_ar });
  const withBooks = await Class.findByPk(klass.id, { include });
  return res.json({ success: true, data: withBooks });
});

const remove = asyncHandler(async (req, res) => {
  const klass = await Class.findByPk(req.params.id);
  if (!klass) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await klass.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

module.exports = { list, getOne, create, update, remove };
