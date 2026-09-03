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
  // Approval workflow for GUDOOMIYE's "New Registered Students" queue: every
  // new student starts 'pending' until a GUDOOMIYE user accepts them (see
  // gudoomiyeReportController.acceptStudent) — accepting only flips this
  // flag, the student row itself is never deleted. Pre-existing students
  // were backfilled to 'accepted' by the migration that added this column
  // (scripts/008-add-student-registration-status.js).
  registrationStatus: {
    type: DataTypes.ENUM('pending', 'accepted'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  indexes: [
    { fields: ['buildingId'] },
  ],
});

module.exports = Student;
