const app = require('./src/app');
const sequelize = require('./src/config/db');
const env = require('./src/config/env');
require('./src/models');

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
