// One-off schema migration: replaces the old per-masjid
// Masjids.resultsVisible column with a single global switch in a new
// system_settings table (one fixed row, id = 1) — see
// server/src/utils/systemSettings.js. Existing masjid/student/result data
// is untouched; only the visibility mechanism changes.
//
// Run manually: node server/scripts/010-global-results-visibility.js
const sequelize = require('../src/config/db');

async function run() {
  console.log('=== Replace per-masjid resultsVisible with a global switch ===');

  const [[{ cnt: tableExists }]] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings'`,
  );
  if (tableExists === 0) {
    console.log('Creating system_settings table...');
    await sequelize.query(`
      CREATE TABLE system_settings (
        id INT NOT NULL PRIMARY KEY,
        resultsVisible TINYINT(1) NOT NULL DEFAULT 1,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);
  } else {
    console.log('system_settings already exists — skipping.');
  }

  const [[{ cnt: rowExists }]] = await sequelize.query(
    'SELECT COUNT(*) AS cnt FROM system_settings WHERE id = 1',
  );
  if (rowExists === 0) {
    console.log('Seeding the single global settings row (id = 1, resultsVisible = true)...');
    await sequelize.query(
      'INSERT INTO system_settings (id, resultsVisible, createdAt, updatedAt) VALUES (1, 1, NOW(), NOW());',
    );
  } else {
    console.log('Global settings row already exists — skipping.');
  }

  const [[{ cnt: oldColExists }]] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Masjids' AND COLUMN_NAME = 'resultsVisible'`,
  );
  if (oldColExists > 0) {
    console.log('Dropping the old per-masjid Masjids.resultsVisible column...');
    await sequelize.query('ALTER TABLE Masjids DROP COLUMN resultsVisible;');
  } else {
    console.log('Masjids.resultsVisible already gone — skipping.');
  }

  console.log('SUCCESS.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
