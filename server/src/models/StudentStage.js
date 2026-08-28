const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// A student's enrollment in one educational stage. Many-to-many: a student
// can be registered for multiple stages over time (see models/index.js for
// the belongsToMany association), replacing the old direct
// Student.classId single-stage FK.
const StudentStage = sequelize.define('StudentStage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'student_id',
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'stage_id',
  },
}, {
  tableName: 'student_stage_registrations',
  indexes: [
    { unique: true, fields: ['student_id', 'stage_id'] },
  ],
});

module.exports = StudentStage;
