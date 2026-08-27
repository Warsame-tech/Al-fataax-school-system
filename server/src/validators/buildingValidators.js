const { body } = require('express-validator');

const create = [
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('name is required (max 150 chars)'),
];

const update = [
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('name is required (max 150 chars)'),
  body('resultsVisible').optional().isBoolean().withMessage('resultsVisible must be true or false'),
];

module.exports = { create, update };
