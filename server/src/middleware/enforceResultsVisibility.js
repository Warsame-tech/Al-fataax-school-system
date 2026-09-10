const { getResultsVisible } = require('../utils/systemSettings');

// The single enforcement point for the global Results Visibility switch —
// applied to every results-reading route (see resultRoutes.js) so no
// endpoint can be missed. Admin always passes through regardless of the
// switch; every other role is blocked outright while it's OFF, with no
// per-masjid/per-stage/per-role exception. This replaces the old
// per-masjid Building.resultsVisible check that used to live inline in
// resultController.getForStudent.
module.exports = async function enforceResultsVisibility(req, res, next) {
  if (req.user.userType === 'admin') return next();

  const visible = await getResultsVisible();
  if (!visible) {
    return res.status(403).json({
      success: false,
      message: 'Results are not currently available. Please contact the administrator.',
    });
  }

  return next();
};
