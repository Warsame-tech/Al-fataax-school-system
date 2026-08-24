const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { User } = require('../models');

const SALT_ROUNDS = 12;
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generatePassword(length = 12) {
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += CHARSET[bytes[i] % CHARSET.length];
  }
  return password;
}

async function run() {
  await sequelize.sync();

  const existingAdmin = await User.findOne({ where: { userType: 'admin' } });
  if (existingAdmin) {
    console.log('Admin already exists, skipping.');
    await sequelize.close();
    process.exit(0);
  }

  const password = generatePassword(12);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await User.create({
    name: 'System Admin',
    passwordHash,
    userType: 'admin',
  });

  const line = '='.repeat(50);
  console.log(`\n${line}`);
  console.log('  ADMIN ACCOUNT CREATED');
  console.log(line);
  console.log(`  Login ID:  ${admin.id}`);
  console.log(`  Password:  ${password}`);
  console.log(line);
  console.log('  WARNING: This password will not be shown again.');
  console.log('  Save it now in a secure location.');
  console.log(`${line}\n`);

  await sequelize.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to seed admin user:', err);
  process.exit(1);
});
