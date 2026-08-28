const { body } = require('express-validator');

const create = [
  body('studentId').trim().notEmpty().withMessage('studentId is required'),
  body('subjectId').isInt().withMessage('subjectId is required'),
  body('marks').isFloat({ min: 0, max: 100 }).withMessage('marks must be a number between 0 and 100'),
];

const update = [
  body('marks').isFloat({ min: 0, max: 100 }).withMessage('marks must be a number between 0 and 100'),
];

// Individual mark values (0-100, allowing blanks for not-yet-entered
// subjects) are validated inside the controller, which also filters out
// blank entries before saving — kept lenient here so a partially-filled
// sheet (some books left blank to fill in later) isn't rejected outright.
const bulkCreate = [
  body('studentId').trim().notEmpty().withMessage('studentId is required'),
  body('marks').isArray({ min: 1 }).withMessage('At least one mark is required.'),
];

module.exports = { create, update, bulkCreate };
