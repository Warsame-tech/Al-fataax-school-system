const asyncHandler = require('../utils/asyncHandler');
const { getResultsVisible, setResultsVisible } = require('../utils/systemSettings');

const getResultsVisibility = asyncHandler(async (req, res) => {
  const resultsVisible = await getResultsVisible();
  return res.json({ success: true, data: { resultsVisible } });
});

const updateResultsVisibility = asyncHandler(async (req, res) => {
  if (typeof req.body.resultsVisible !== 'boolean') {
    return res.status(400).json({ success: false, message: 'resultsVisible must be true or false' });
  }
  const resultsVisible = await setResultsVisible(req.body.resultsVisible);
  return res.json({ success: true, data: { resultsVisible } });
});

module.exports = { getResultsVisibility, updateResultsVisibility };
