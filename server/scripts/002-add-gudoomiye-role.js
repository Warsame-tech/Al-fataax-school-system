// One-off schema migration: widens Users.userType to include 'gudoomiye'.
// Run manually: node server/scripts/002-add-gudoomiye-role.js
// Safe/low-risk: an additive ENUM value, no data conversion, no existing
// rows affected.
const sequelize = require('../src/config/db');

async function run() {
  console.log("Widening Users.userType ENUM to add 'gudoomiye'...");
  await sequelize.query(
    "ALTER TABLE Users MODIFY userType ENUM('admin','teacher','student','coordinator','gudoomiye') NOT NULL;",
  );
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
