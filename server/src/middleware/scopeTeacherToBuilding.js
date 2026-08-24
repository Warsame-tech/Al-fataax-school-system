// For teacher/coordinator-role requests, forces the effective buildingId to
// their own building regardless of any client-supplied query param, so a
// tampered request can never read another building's results.
module.exports = function scopeTeacherToBuilding(req, res, next) {
  if (req.user.userType === 'teacher' || req.user.userType === 'coordinator') {
    req.effectiveBuildingId = req.user.buildingId;
  } else {
    req.effectiveBuildingId = req.query.buildingId;
  }
  return next();
};
