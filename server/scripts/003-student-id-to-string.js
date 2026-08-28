// One-off schema migration: changes Student.id from INTEGER AUTO_INCREMENT
// to VARCHAR(30), and cascades the same type change to every FK that
// references it (Results.studentId, Users.studentId).
//
// Run manually: node server/scripts/003-student-id-to-string.js
//
// SAFE TO RUN BEFORE the new app code deploys: MySQL casts existing
// integer values to their string form in place (e.g. 2 -> '2'), so the old
// Number()-coercing controllers keep working unchanged against the new
// column type until the new string-aware code ships separately.
//
// DESTRUCTIVE IF INTERRUPTED HALFWAY. A full mysqldump backup must exist
// before running this (see server/backups/ or wherever yours was taken).
// This script logs every step and verifies row counts before exiting.
const sequelize = require('../src/config/db');

async function getFkName(tableName, columnName) {
  const [rows] = await sequelize.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tableName AND COLUMN_NAME = :columnName
       AND REFERENCED_TABLE_NAME = 'Students'`,
    { replacements: { tableName, columnName } },
  );
  return rows[0]?.CONSTRAINT_NAME || null;
}

async function run() {
  console.log('=== Student.id -> VARCHAR(30) migration ===');

  const [[{ cnt: studentsBefore }]] = await sequelize.query('SELECT COUNT(*) AS cnt FROM Students');
  const [[{ cnt: resultsBefore }]] = await sequelize.query('SELECT COUNT(*) AS cnt FROM Results');
  const [[{ cnt: usersBefore }]] = await sequelize.query('SELECT COUNT(*) AS cnt FROM Users WHERE studentId IS NOT NULL');
  console.log(`Before: Students=${studentsBefore}, Results=${resultsBefore}, Users.studentId(non-null)=${usersBefore}`);

  const resultsFk = await getFkName('Results', 'studentId');
  const usersFk = await getFkName('Users', 'studentId');
  console.log('Discovered FKs:', { resultsFk, usersFk });
  if (!resultsFk || !usersFk) {
    throw new Error('Could not discover one or both FK constraint names — aborting before making any change.');
  }

  console.log('Disabling FK checks...');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

  console.log(`Dropping FK ${resultsFk} on Results.studentId...`);
  await sequelize.query(`ALTER TABLE Results DROP FOREIGN KEY \`${resultsFk}\`;`);

  console.log(`Dropping FK ${usersFk} on Users.studentId...`);
  await sequelize.query(`ALTER TABLE Users DROP FOREIGN KEY \`${usersFk}\`;`);

  console.log('Converting Students.id to VARCHAR(30)...');
  await sequelize.query('ALTER TABLE Students MODIFY id VARCHAR(30) NOT NULL;');

  console.log('Converting Results.studentId to VARCHAR(30)...');
  await sequelize.query('ALTER TABLE Results MODIFY studentId VARCHAR(30) NOT NULL;');

  console.log('Converting Users.studentId to VARCHAR(30)...');
  await sequelize.query('ALTER TABLE Users MODIFY studentId VARCHAR(30) NULL;');

  console.log('Re-adding FK Results.studentId -> Students.id (ON DELETE CASCADE)...');
  await sequelize.query(
    'ALTER TABLE Results ADD CONSTRAINT fk_results_student FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE CASCADE;',
  );

  console.log('Re-adding FK Users.studentId -> Students.id (ON DELETE RESTRICT)...');
  await sequelize.query(
    'ALTER TABLE Users ADD CONSTRAINT fk_users_student FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE RESTRICT;',
  );

  console.log('Re-enabling FK checks...');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

  const [[{ cnt: studentsAfter }]] = await sequelize.query('SELECT COUNT(*) AS cnt FROM Students');
  const [[{ cnt: resultsAfter }]] = await sequelize.query('SELECT COUNT(*) AS cnt FROM Results');
  const [[{ cnt: usersAfter }]] = await sequelize.query('SELECT COUNT(*) AS cnt FROM Users WHERE studentId IS NOT NULL');
  const [[{ cnt: orphanResults }]] = await sequelize.query(
    'SELECT COUNT(*) AS cnt FROM Results r LEFT JOIN Students s ON r.studentId = s.id WHERE s.id IS NULL',
  );
  const [[{ cnt: orphanUsers }]] = await sequelize.query(
    'SELECT COUNT(*) AS cnt FROM Users u LEFT JOIN Students s ON u.studentId = s.id WHERE u.studentId IS NOT NULL AND s.id IS NULL',
  );

  console.log(`After: Students=${studentsAfter}, Results=${resultsAfter}, Users.studentId(non-null)=${usersAfter}`);
  console.log(`Orphan check: Results with no matching Student=${orphanResults}, Users with no matching Student=${orphanUsers}`);

  const ok =
    studentsBefore === studentsAfter &&
    resultsBefore === resultsAfter &&
    usersBefore === usersAfter &&
    orphanResults === 0 &&
    orphanUsers === 0;

  if (!ok) {
    console.error('VERIFICATION FAILED — row counts or orphan checks did not match expectations. Investigate before proceeding.');
    process.exit(1);
  }

  const [sample] = await sequelize.query('SELECT id, name FROM Students ORDER BY id LIMIT 5');
  console.log('Sample of migrated Student ids (now strings):', JSON.stringify(sample));

  console.log('SUCCESS — all row counts match, no orphaned FKs.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  console.error('If this failed partway through, FOREIGN_KEY_CHECKS may still be 0 — verify and re-enable manually, then restore from backup if the schema is in an inconsistent state.');
  process.exit(1);
});
