const { body } = require('express-validator');

const USER_TYPES = ['admin', 'teacher', 'student', 'coordinator'];
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

const create = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('username must be 3-100 characters')
    .matches(USERNAME_PATTERN)
    .withMessage('username may only contain letters, numbers, and underscores'),
  body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('userType').isIn(USER_TYPES).withMessage(`userType must be one of: ${USER_TYPES.join(', ')}`),
  body('teacherId').optional({ nullable: true }).isInt(),
  body('studentId').optional({ nullable: true }).isInt(),
  body('coordinatorId').optional({ nullable: true }).isInt(),
];

const update = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('username must be 3-100 characters')
    .matches(USERNAME_PATTERN)
    .withMessage('username may only contain letters, numbers, and underscores'),
  body('password').optional({ nullable: true }).isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('userType').isIn(USER_TYPES).withMessage(`userType must be one of: ${USER_TYPES.join(', ')}`),
  body('teacherId').optional({ nullable: true }).isInt(),
  body('studentId').optional({ nullable: true }).isInt(),
  body('coordinatorId').optional({ nullable: true }).isInt(),
];

module.exports = { create, update };
