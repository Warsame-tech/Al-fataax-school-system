// One-off schema fix: MySQL FK constraints default to ON UPDATE RESTRICT
// unless declared otherwise. Since Student.id is a real, renameable value
// (not a surrogate key — see studentController.js's rename endpoint), every
// FK that references it needs ON UPDATE CASCADE so a rename automatically
// propagates to Results.studentId, Users.studentId, and
// student_stage_registrations.student_id at the database level (the
// application-level updates in the rename transaction become a defensive
// no-op belt-and-suspenders on top of this, not the primary mechanism).
//
// Run manually: node server/scripts/006-add-on-update-cascade-for-student-fks.js
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

async function fixFk(tableName, columnName, onDelete) {
  const fkName = await getFkName(tableName, columnName);
  if (!fkName) {
    console.log(`No existing FK found on ${tableName}.${columnName} — skipping.`);
    return;
  }
  console.log(`Dropping ${fkName} on ${tableName}.${columnName}...`);
  await sequelize.query(`ALTER TABLE ${tableName} DROP FOREIGN KEY \`${fkName}\`;`);
  console.log(`Re-adding with ON UPDATE CASCADE ON DELETE ${onDelete}...`);
  await sequelize.query(
    `ALTER TABLE ${tableName} ADD CONSTRAINT \`${fkName}\` FOREIGN KEY (${columnName}) REFERENCES Students(id) ON UPDATE CASCADE ON DELETE ${onDelete};`,
  );
}

async function run() {
  console.log('=== Adding ON UPDATE CASCADE to Student-referencing FKs ===');
  await fixFk('Results', 'studentId', 'CASCADE');
  await fixFk('Users', 'studentId', 'RESTRICT');
  await fixFk('student_stage_registrations', 'student_id', 'CASCADE');
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
