const { body } = require('express-validator');

const add = [
  body('classId').isInt().withMessage('classId is required'),
];

module.exports = { add };
