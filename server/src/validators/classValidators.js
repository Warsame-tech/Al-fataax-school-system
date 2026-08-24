const { body } = require('express-validator');

const create = [
  body('name_ar').trim().isLength({ min: 1, max: 255 }).withMessage('name_ar is required (max 255 chars)'),
  body('bookIds').optional().isArray().withMessage('bookIds must be an array of Religious Book ids'),
];

const update = [
  body('name_ar').trim().isLength({ min: 1, max: 255 }).withMessage('name_ar is required (max 255 chars)'),
  body('bookIds').optional().isArray().withMessage('bookIds must be an array of Religious Book ids'),
];

module.exports = { create, update };
