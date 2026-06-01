const ApiError = require('../utils/ApiError');
const { hasPermission } = require('../services/auth.service');

function requireRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have access to this resource'));
    }

    return next();
  };
}

function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!hasPermission(req.user, permission)) {
      return next(new ApiError(403, `Missing permission: ${permission}`));
    }

    return next();
  };
}

module.exports = {
  requirePermission,
  requireRoles,
};
