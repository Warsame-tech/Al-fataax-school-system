const { ownBuildingId } = require('../utils/scoping');

// For coordinator-role requests, forces the effective buildingId to their
// own building regardless of any client-supplied query param, so a
// tampered request can never read another building's results.
module.exports = function scopeToOwnBuilding(req, res, next) {
  const own = ownBuildingId(req.user);
  req.effectiveBuildingId = own != null ? own : req.query.buildingId;
  return next();
};
