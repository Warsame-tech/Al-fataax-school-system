// One-off schema migration, run AFTER the StudentStage-aware code has
// deployed and booted at least once (so sequelize.sync() has already
// created student_stage_registrations).
// Run manually: node server/scripts/004-backfill-student-stages-and-drop-classid.js
//
// 1. Backfills every existing student's current single stage (Students.classId)
//    as their first stage registration — zero data loss.
// 2. Drops the now-unused Students.classId column + its FK.
const sequelize = require('../src/config/db');

async function run() {
  console.log('=== Backfill student_stage_registrations + drop Students.classId ===');

  const [[{ cnt: classIdCol }]] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Students' AND COLUMN_NAME = 'classId'`,
  );
  if (classIdCol === 0) {
    console.log('Students.classId already removed — nothing to do.');
    process.exit(0);
  }

  const [[{ cnt: studentsWithClass }]] = await sequelize.query(
    'SELECT COUNT(*) AS cnt FROM Students WHERE classId IS NOT NULL',
  );
  console.log(`Students with a classId to backfill: ${studentsWithClass}`);

  await sequelize.query(
    `INSERT INTO student_stage_registrations (student_id, stage_id, createdAt, updatedAt)
     SELECT id, classId, NOW(), NOW() FROM Students WHERE classId IS NOT NULL`,
  );

  const [[{ cnt: registrationsAfter }]] = await sequelize.query(
    'SELECT COUNT(*) AS cnt FROM student_stage_registrations',
  );
  console.log(`student_stage_registrations row count after backfill: ${registrationsAfter}`);
  if (registrationsAfter < studentsWithClass) {
    console.error('VERIFICATION FAILED — fewer registrations than expected. Aborting before dropping classId.');
    process.exit(1);
  }

  const [fkRows] = await sequelize.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Students' AND COLUMN_NAME = 'classId'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
  );
  const fkName = fkRows[0]?.CONSTRAINT_NAME;
  if (fkName) {
    console.log(`Dropping FK ${fkName} on Students.classId...`);
    await sequelize.query(`ALTER TABLE Students DROP FOREIGN KEY \`${fkName}\`;`);
  } else {
    console.log('No FK found on Students.classId (already dropped or never existed) — continuing.');
  }

  console.log('Dropping Students.classId column...');
  await sequelize.query('ALTER TABLE Students DROP COLUMN classId;');

  console.log('SUCCESS.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
