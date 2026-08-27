const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  userType: {
    type: DataTypes.ENUM('admin', 'teacher', 'student', 'coordinator', 'gudoomiye'),
    allowNull: false,
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
  },
  coordinatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
  },
}, {
  defaultScope: {
    attributes: { exclude: ['passwordHash'] },
  },
  scopes: {
    withPassword: {
      attributes: { include: ['passwordHash'] },
    },
  },
});

module.exports = User;
