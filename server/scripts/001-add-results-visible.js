// One-off schema migration: adds Building.resultsVisible (default true).
// Run manually: node server/scripts/001-add-results-visible.js
// Safe/low-risk: a single additive column with a default, no data conversion.
const sequelize = require('../src/config/db');

async function run() {
  console.log('Adding Masjids.resultsVisible (BOOLEAN NOT NULL DEFAULT TRUE)...');

  const [existing] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Masjids' AND COLUMN_NAME = 'resultsVisible'`,
  );
  if (existing[0].cnt > 0) {
    console.log('Column already exists — nothing to do.');
    process.exit(0);
  }

  await sequelize.query('ALTER TABLE Masjids ADD COLUMN resultsVisible TINYINT(1) NOT NULL DEFAULT 1;');
  console.log('Done. Every existing masjid now has resultsVisible = true.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
