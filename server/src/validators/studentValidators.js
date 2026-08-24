const { body } = require('express-validator');

const GENDERS = ['Male', 'Female'];

const create = [
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('name is required (max 150 chars)'),
  body('gender').isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(', ')}`),
  body('buildingId').optional().isInt().withMessage('buildingId must be valid'),
  body('classId').isInt().withMessage('classId is required'),
];

const update = [
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('name is required (max 150 chars)'),
  body('gender').isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(', ')}`),
  body('buildingId').optional().isInt().withMessage('buildingId must be valid'),
  body('classId').isInt().withMessage('classId is required'),
];

module.exports = { create, update };
