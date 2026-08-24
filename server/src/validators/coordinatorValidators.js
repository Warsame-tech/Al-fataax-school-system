const { body } = require('express-validator');

const create = [
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('name is required (max 150 chars)'),
  body('buildingId').isInt().withMessage('buildingId is required'),
];

const update = [
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('name is required (max 150 chars)'),
  body('buildingId').isInt().withMessage('buildingId is required'),
];

module.exports = { create, update };
