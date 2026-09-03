// Single source of truth for "is this role locked to one masjid, and which
// one" — reused by scopeToOwnBuilding.js, studentController.js, and
// resultController.js so the rule can never quietly drift between them.
const BUILDING_SCOPED_ROLES = new Set(['coordinator']);

function isBuildingScopedRole(userType) {
  return BUILDING_SCOPED_ROLES.has(userType);
}

// Returns the caller's own buildingId if their role is masjid-scoped
// (coordinator), otherwise null (admin has no implicit scope).
function ownBuildingId(user) {
  return isBuildingScopedRole(user?.userType) ? user.buildingId : null;
}

module.exports = { isBuildingScopedRole, ownBuildingId };
