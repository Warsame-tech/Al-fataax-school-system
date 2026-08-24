// Single source of truth for "is this role locked to one masjid, and which
// one" — reused by scopeTeacherToBuilding.js, studentController.js, and
// resultController.js so the rule can never quietly drift between them.
const BUILDING_SCOPED_ROLES = new Set(['teacher', 'coordinator']);

function isBuildingScopedRole(userType) {
  return BUILDING_SCOPED_ROLES.has(userType);
}

// Returns the caller's own buildingId if their role is masjid-scoped
// (teacher/coordinator), otherwise null (admin has no implicit scope).
function ownBuildingId(user) {
  return isBuildingScopedRole(user?.userType) ? user.buildingId : null;
}

module.exports = { isBuildingScopedRole, ownBuildingId };
