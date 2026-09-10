const { SystemSetting } = require('../models');

// The one settings row always lives at id 1 — see models/SystemSetting.js.
const SETTINGS_ID = 1;

async function getResultsVisible() {
  const row = await SystemSetting.findByPk(SETTINGS_ID);
  // No row yet (fresh install before the row is seeded) defaults to
  // visible, matching the old per-masjid default.
  return row ? row.resultsVisible : true;
}

async function setResultsVisible(value) {
  const [row] = await SystemSetting.findOrCreate({
    where: { id: SETTINGS_ID },
    defaults: { resultsVisible: value },
  });
  if (row.resultsVisible !== value) {
    await row.update({ resultsVisible: value });
  }
  return row.resultsVisible;
}

module.exports = { getResultsVisible, setResultsVisible };
