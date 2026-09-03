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
  // Used by the Forgot Password flow (see passwordResetController.js) to
  // look up which account an OTP should be issued for. Only the admin
  // account is expected to have one set; nullable/unique so most users
  // (whose username already doubles as their identity) never need it.
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
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
    type: DataTypes.ENUM('admin', 'student', 'coordinator', 'gudoomiye'),
    allowNull: false,
  },
  studentId: {
    type: DataTypes.STRING(30),
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
