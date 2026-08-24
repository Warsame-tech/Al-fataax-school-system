const { body } = require('express-validator');

const create = [
  body('name_ar').trim().isLength({ min: 1, max: 255 }).withMessage('name_ar is required (max 255 chars)'),
];

const update = [
  body('name_ar').trim().isLength({ min: 1, max: 255 }).withMessage('name_ar is required (max 255 chars)'),
];

module.exports = { create, update };
