const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/generateToken');

function getAccessToken(req) {
  const authHeader = req.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return req.cookies?.accessToken;
}

async function requireAuth(req, _res, next) {
  try {
    const token = getAccessToken(req);

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = verifyToken(token);

    if (decoded.type === 'refresh') {
      throw new ApiError(401, 'Access token required');
    }

    const user = await User.findById(decoded.sub).populate('school', 'name code status');

    if (!user) {
      throw new ApiError(401, 'Authenticated user no longer exists');
    }

    if (user.status !== 'active') {
      throw new ApiError(403, `Account is ${user.status}`);
    }

    if (user.school && user.school.status !== 'active') {
      throw new ApiError(403, `School account is ${user.school.status}`);
    }

    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new ApiError(401, 'Password changed after token was issued');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };
