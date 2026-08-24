const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Internally still called "Subject" to minimize churn in existing Result/grade
// logic, but represents the "religious_books" table (Religious Book Registration
// in the UI) — Arabic name (name_ar) belonging to a Fan (fan_id).
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_ar: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  fanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'fan_id',
  },
}, {
  tableName: 'religious_books',
});

module.exports = Subject;
