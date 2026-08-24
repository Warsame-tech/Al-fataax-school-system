const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Fan = sequelize.define('Fan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_ar: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'fans',
});

module.exports = Fan;
