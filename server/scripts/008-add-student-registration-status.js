// One-off schema migration: adds a registrationStatus column to Students,
// powering the GUDOOMIYE "New Registered Students" approval queue.
//
// Run manually: node server/scripts/008-add-student-registration-status.js
//
// New students default to 'pending' (enforced at the Sequelize model level
// going forward) until a GUDOOMIYE user accepts them, at which point the row
// flips to 'accepted' — the student is never deleted, only this status
// changes. Every student that already exists in the database at migration
// time is backfilled to 'accepted' immediately below, so the entire
// pre-existing student body doesn't suddenly appear in the pending queue.
const sequelize = require('../src/config/db');

async function run() {
  console.log('=== Add Students.registrationStatus migration ===');

  const [[{ cnt: colExists }]] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Students' AND COLUMN_NAME = 'registrationStatus'`,
  );
  if (colExists > 0) {
    console.log('Students.registrationStatus already exists — nothing to do.');
    process.exit(0);
  }

  const [[{ cnt: studentsBefore }]] = await sequelize.query('SELECT COUNT(*) AS cnt FROM Students');
  console.log(`Students to backfill as 'accepted': ${studentsBefore}`);

  console.log("Adding Students.registrationStatus ENUM('pending','accepted') NOT NULL DEFAULT 'pending'...");
  await sequelize.query(
    "ALTER TABLE Students ADD COLUMN registrationStatus ENUM('pending','accepted') NOT NULL DEFAULT 'pending';",
  );

  console.log("Backfilling every pre-existing student to 'accepted'...");
  await sequelize.query("UPDATE Students SET registrationStatus = 'accepted';");

  const [[{ cnt: pendingAfter }]] = await sequelize.query(
    "SELECT COUNT(*) AS cnt FROM Students WHERE registrationStatus = 'pending'",
  );
  if (pendingAfter !== 0) {
    console.error('VERIFICATION FAILED — some pre-existing students are still marked pending.');
    process.exit(1);
  }

  console.log('SUCCESS — column added, all existing students backfilled to accepted.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
