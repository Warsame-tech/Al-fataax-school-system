const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Student ID is admin-typed free text (letters/digits/hyphens), not an
// auto-increment integer — it also doubles as the student's login username
// (see userController.js), so it's a real, meaningful identifier rather
// than a surrogate key. Renaming it after creation goes through a small
// transactional helper (see studentController.js's rename) that cascades
// the change to Result.studentId and User.studentId together, rather than
// allowing a plain PK edit.
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female'),
    allowNull: false,
  },
  buildingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  indexes: [
    { fields: ['buildingId'] },
  ],
});

module.exports = Student;
