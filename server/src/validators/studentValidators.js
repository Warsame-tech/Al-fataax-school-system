const { body } = require('express-validator');

const GENDERS = ['Male', 'Female'];
const STUDENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

const create = [
  body('id')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Student ID must be 3-30 characters')
    .matches(STUDENT_ID_PATTERN)
    .withMessage('Student ID may only contain letters, numbers, and hyphens'),
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('name is required (max 150 chars)'),
  body('gender').isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(', ')}`),
  body('buildingId').optional().isInt().withMessage('buildingId must be valid'),
];

const update = [
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('name is required (max 150 chars)'),
  body('gender').isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(', ')}`),
  body('buildingId').optional().isInt().withMessage('buildingId must be valid'),
];

const rename = [
  body('newId')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('New Student ID must be 3-30 characters')
    .matches(STUDENT_ID_PATTERN)
    .withMessage('New Student ID may only contain letters, numbers, and hyphens'),
];

module.exports = { create, update, rename };
