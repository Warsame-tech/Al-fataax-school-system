// One-off schema migration: adds Users.email and the password_reset_otps
// table powering the Forgot Password / OTP flow, then sets the existing
// admin account's email to the address specified by the feature request.
//
// Run manually: node server/scripts/009-add-forgot-password.js
const sequelize = require('../src/config/db');

const ADMIN_EMAIL = 'abdiwahabmire11@gmail.com';

async function run() {
  console.log('=== Add Forgot Password schema (Users.email + password_reset_otps) ===');

  const [[{ cnt: emailColExists }]] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'email'`,
  );
  if (emailColExists === 0) {
    console.log('Adding Users.email...');
    await sequelize.query('ALTER TABLE Users ADD COLUMN email VARCHAR(255) NULL UNIQUE;');
  } else {
    console.log('Users.email already exists — skipping.');
  }

  const [[{ cnt: tableExists }]] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_otps'`,
  );
  if (tableExists === 0) {
    console.log('Creating password_reset_otps table...');
    await sequelize.query(`
      CREATE TABLE password_reset_otps (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        otpHash VARCHAR(255) NOT NULL,
        expiresAt DATETIME NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        verified TINYINT(1) NOT NULL DEFAULT 0,
        passwordResetAt DATETIME NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        KEY idx_password_reset_otps_user (userId),
        CONSTRAINT fk_password_reset_otps_user FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      );
    `);
  } else {
    console.log('password_reset_otps already exists — skipping.');
  }

  console.log(`Setting the admin account's email to ${ADMIN_EMAIL}...`);
  const [, meta] = await sequelize.query(
    'UPDATE Users SET email = :email WHERE userType = :userType AND (email IS NULL OR email != :email)',
    { replacements: { email: ADMIN_EMAIL, userType: 'admin' } },
  );
  console.log('Rows updated:', meta?.affectedRows ?? meta ?? 0);

  const [[adminRow]] = await sequelize.query(
    "SELECT id, username, email FROM Users WHERE userType = 'admin' LIMIT 1",
  );
  console.log('Admin account now:', adminRow);

  console.log('SUCCESS.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
