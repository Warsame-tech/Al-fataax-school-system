const { body } = require('express-validator');

const USER_TYPES = ['admin', 'student', 'coordinator', 'gudoomiye'];
// Widened to allow hyphens: a student's username is always their Student
// ID (see userController.js), and Student IDs may contain hyphens
// (e.g. "STU-A102").
const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const create = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('username must be 3-100 characters')
    .matches(USERNAME_PATTERN)
    .withMessage('username may only contain letters, numbers, underscores, and hyphens'),
  body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('userType').isIn(USER_TYPES).withMessage(`userType must be one of: ${USER_TYPES.join(', ')}`),
  body('studentId').optional({ nullable: true }).isString(),
  body('coordinatorId').optional({ nullable: true }).isInt(),
  body('email').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('email must be a valid email address'),
];

const update = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('username must be 3-100 characters')
    .matches(USERNAME_PATTERN)
    .withMessage('username may only contain letters, numbers, underscores, and hyphens'),
  body('password').optional({ nullable: true }).isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('userType').isIn(USER_TYPES).withMessage(`userType must be one of: ${USER_TYPES.join(', ')}`),
  body('studentId').optional({ nullable: true }).isString(),
  body('coordinatorId').optional({ nullable: true }).isInt(),
  body('email').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('email must be a valid email address'),
];

module.exports = { create, update };
