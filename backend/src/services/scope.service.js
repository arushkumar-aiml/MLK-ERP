const ApiError = require('../utils/ApiError');

const SCHOOL_READ_ROLES = ['superadmin', 'admin', 'principal'];
const SCHOOL_WRITE_ROLES = ['superadmin', 'admin', 'principal'];

function getUserSchoolId(user) {
  return user?.school?._id || user?.school;
}

function ensureModuleAccess(user, { write = false } = {}) {
  const allowedRoles = write ? SCHOOL_WRITE_ROLES : SCHOOL_READ_ROLES;

  if (!user || !allowedRoles.includes(user.role)) {
    throw new ApiError(403, 'You do not have access to this module');
  }
}

function buildSchoolScope(user, requestedSchoolId, { write = false } = {}) {
  ensureModuleAccess(user, { write });

  if (user.role === 'superadmin') {
    if (!requestedSchoolId) {
      return {};
    }

    return { school: requestedSchoolId };
  }

  const assignedSchool = getUserSchoolId(user);

  if (!assignedSchool) {
    throw new ApiError(403, 'No school is assigned to this account');
  }

  if (requestedSchoolId && String(requestedSchoolId) !== String(assignedSchool)) {
    throw new ApiError(403, 'You can only access your assigned school');
  }

  return { school: assignedSchool };
}

function resolveSchoolForWrite(user, requestedSchoolId) {
  const scope = buildSchoolScope(user, requestedSchoolId, { write: true });

  if (!scope.school) {
    throw new ApiError(400, 'school is required');
  }

  return scope.school;
}

module.exports = {
  buildSchoolScope,
  ensureModuleAccess,
  getUserSchoolId,
  resolveSchoolForWrite,
};
