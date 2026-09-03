// One-off schema migration: removes the Teacher role/table entirely, per
// the decision to fully remove Teacher management from the system (rather
// than keep a scoped-down version of it).
//
// Run manually: node server/scripts/007-remove-teachers.js
//
// Before touching any table, this script dumps every row of Teachers and
// every Users row with userType='teacher' to a timestamped SQL backup file
// under backups/, as plain INSERT statements (no mysqldump binary is
// available in this environment) — restorable by hand if this was run in
// error.
//
// Steps, each logged and verified:
//   1. Back up Teachers + Users(userType='teacher') to backups/pre_teacher_removal_backup.sql
//   2. Delete Users rows with userType='teacher' (a Teacher row can't be
//      dropped while a User still references it via teacherId, which
//      carries ON DELETE RESTRICT)
//   3. Drop the FK + column Users.teacherId
//   4. Narrow Users.userType ENUM to drop 'teacher' (safe now — no row
//      still holds that value after step 2)
//   5. Drop the Teachers table (its own FK to Masjids goes with it)
const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/db');

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function toInsertStatements(tableName, rows) {
  if (rows.length === 0) return `-- ${tableName}: no rows to back up\n`;
  const columns = Object.keys(rows[0]);
  const lines = rows.map(
    (row) => `INSERT INTO \`${tableName}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${columns.map((c) => sqlString(row[c])).join(', ')});`,
  );
  return lines.join('\n') + '\n';
}

async function run() {
  console.log('=== Remove Teacher role/table migration ===');

  const [teacherRows] = await sequelize.query('SELECT * FROM Teachers');
  const [teacherUserRows] = await sequelize.query("SELECT * FROM Users WHERE userType = 'teacher'");
  console.log(`Backing up ${teacherRows.length} Teachers row(s) and ${teacherUserRows.length} teacher User row(s)...`);

  const backupPath = path.join(__dirname, '..', '..', 'backups', 'pre_teacher_removal_backup.sql');
  const backupContent =
    `-- Backup taken by 007-remove-teachers.js on ${new Date().toISOString()}\n` +
    `-- Restore by running these INSERT statements against the live schema\n` +
    `-- (Teachers table and Users.teacherId column must still exist).\n\n` +
    `-- Teachers (${teacherRows.length} rows)\n` +
    toInsertStatements('Teachers', teacherRows) +
    `\n-- Users with userType='teacher' (${teacherUserRows.length} rows)\n` +
    toInsertStatements('Users', teacherUserRows);
  fs.writeFileSync(backupPath, backupContent, 'utf8');
  console.log(`Backup written to ${backupPath}`);

  console.log(`Deleting ${teacherUserRows.length} Users row(s) with userType='teacher'...`);
  await sequelize.query("DELETE FROM Users WHERE userType = 'teacher'");

  const [[{ cnt: remainingTeacherUsers }]] = await sequelize.query(
    "SELECT COUNT(*) AS cnt FROM Users WHERE userType = 'teacher'",
  );
  if (remainingTeacherUsers !== 0) {
    console.error('VERIFICATION FAILED — teacher Users rows still remain. Aborting before touching schema.');
    process.exit(1);
  }

  const [fkRows] = await sequelize.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'teacherId'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
  );
  const teacherIdFk = fkRows[0]?.CONSTRAINT_NAME;
  if (teacherIdFk) {
    console.log(`Dropping FK ${teacherIdFk} on Users.teacherId...`);
    await sequelize.query(`ALTER TABLE Users DROP FOREIGN KEY \`${teacherIdFk}\`;`);
  } else {
    console.log('No FK found on Users.teacherId (already dropped or never existed) — continuing.');
  }

  console.log('Dropping Users.teacherId column...');
  await sequelize.query('ALTER TABLE Users DROP COLUMN teacherId;');

  console.log("Narrowing Users.userType ENUM to drop 'teacher'...");
  await sequelize.query(
    "ALTER TABLE Users MODIFY userType ENUM('admin','student','coordinator','gudoomiye') NOT NULL;",
  );

  console.log('Dropping Teachers table...');
  await sequelize.query('DROP TABLE IF EXISTS Teachers;');

  const [[{ cnt: teachersTableExists }]] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Teachers'`,
  );
  const [[{ cnt: teacherIdColExists }]] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'teacherId'`,
  );

  if (teachersTableExists !== 0 || teacherIdColExists !== 0) {
    console.error('VERIFICATION FAILED — Teachers table or Users.teacherId column still present.');
    process.exit(1);
  }

  console.log('SUCCESS — Teacher role, table, and column fully removed.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  console.error(`If this failed partway through, restore from ${path.join('backups', 'pre_teacher_removal_backup.sql')} and investigate before retrying.`);
  process.exit(1);
});
