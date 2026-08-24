const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Internally still called "Class" to minimize churn in existing Student/Result
// logic, but represents the "educational_stages" table (Educational Stage
// Registration in the UI) — Arabic name (name_ar), linked to Religious Books
// (Subject model) via the stage_religious_books junction table.
const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_ar: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'educational_stages',
});

module.exports = Class;
