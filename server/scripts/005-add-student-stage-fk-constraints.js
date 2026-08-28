// One-off schema fix: adds the missing FK constraints on
// student_stage_registrations.
//
// Why this is needed: sequelize.sync() does create the table itself (from
// the StudentStage model), but does NOT add FK constraints for `through`
// tables used by a belongsToMany association, even on a table it just
// created fresh. This is a general limitation of plain sync(), not
// specific to this database, so it will recur on any fresh deployment —
// run this once after the app has booted at least once post-deploy.
//
// Run manually: node server/scripts/005-add-student-stage-fk-constraints.js
const sequelize = require('../src/config/db');

async function constraintExists(name) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = :name`,
    { replacements: { name } },
  );
  return rows[0].cnt > 0;
}

async function run() {
  console.log('=== Adding FK constraints to student_stage_registrations ===');

  if (await constraintExists('fk_studentstage_student')) {
    console.log('fk_studentstage_student already exists — skipping.');
  } else {
    await sequelize.query(
      'ALTER TABLE student_stage_registrations ADD CONSTRAINT fk_studentstage_student FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE;',
    );
    console.log('Added fk_studentstage_student (student_id -> Students.id, ON DELETE CASCADE).');
  }

  if (await constraintExists('fk_studentstage_class')) {
    console.log('fk_studentstage_class already exists — skipping.');
  } else {
    await sequelize.query(
      'ALTER TABLE student_stage_registrations ADD CONSTRAINT fk_studentstage_class FOREIGN KEY (stage_id) REFERENCES educational_stages(id) ON DELETE RESTRICT;',
    );
    console.log('Added fk_studentstage_class (stage_id -> educational_stages.id, ON DELETE RESTRICT).');
  }

  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
