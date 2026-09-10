const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// A single global settings row (id is always fixed at 1 — see
// utils/systemSettings.js) — currently just the one global Results
// Visibility switch, replacing the old per-masjid Building.resultsVisible
// toggle. Deliberately one row, not one-per-anything, since this setting
// is explicitly meant to have exactly one source of truth for the whole
// system.
const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  resultsVisible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'system_settings',
});

module.exports = SystemSetting;
