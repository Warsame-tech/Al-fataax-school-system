const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// One row per issued OTP. Only ever hashed (never plaintext) — mirrors how
// passwords are stored. `verified` flips true once the correct code is
// entered; `passwordResetAt` flips non-null once that verified OTP has
// actually been spent to change the password, so a reset token can never
// be replayed to set the password a second time. See
// passwordResetController.js for the full forgot-password flow.
const PasswordResetOtp = sequelize.define('PasswordResetOtp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  otpHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  passwordResetAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'password_reset_otps',
  indexes: [
    { fields: ['userId'] },
  ],
});

module.exports = PasswordResetOtp;
