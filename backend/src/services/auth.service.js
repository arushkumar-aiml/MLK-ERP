const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');

const ACTIVE_STATUS = 'active';
const MAX_REFRESH_TOKENS_PER_USER = 5;

const ROLE_PERMISSIONS = {
  superadmin: ['auth:read', 'auth:write', 'users:read', 'users:write', 'schools:read', 'schools:write'],
  admin: [
    'auth:read',
    'auth:write',
    'users:read',
    'users:write',
    'schools:read',
    'students:read',
    'students:write',
    'teachers:read',
    'teachers:write',
    'fees:read',
    'fees:write',
    'attendance:read',
    'attendance:write',
    'exams:read',
    'exams:write',
    'notices:read',
    'notices:write',
    'reports:read',
    'marketing:write',
  ],
  principal: [
    'auth:read',
    'users:read',
    'schools:read',
    'students:read',
    'students:write',
    'teachers:read',
    'teachers:write',
    'fees:read',
    'attendance:read',
    'attendance:write',
    'exams:read',
    'exams:write',
    'notices:read',
    'notices:write',
    'reports:read',
    'marketing:write',
  ],
  teacher: ['auth:read', 'students:read', 'attendance:read', 'attendance:write', 'exams:read', 'notices:read'],
  student: ['auth:read'],
};

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sanitizeUser(user) {
  return {
    id: user._id,
    school: user.school,
    loginId: user.loginId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    permissions: user.permissions,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function assertActiveAccount(user) {
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.status !== ACTIVE_STATUS) {
    throw new ApiError(403, `Account is ${user.status}`);
  }
}

function getTokenExpiry(token) {
  const decoded = verifyRefreshToken(token);
  return new Date(decoded.exp * 1000);
}

async function findUserForLogin(identifier) {
  const normalizedIdentifier = String(identifier || '').trim();

  if (!normalizedIdentifier) {
    throw new ApiError(400, 'Login ID, username, or email is required');
  }

  return User.findOne({
    $or: [
      { loginId: normalizedIdentifier.toUpperCase() },
      { username: normalizedIdentifier.toLowerCase() },
      { email: normalizedIdentifier.toLowerCase() },
    ],
  }).select('+passwordHash +refreshTokens +refreshTokens.tokenHash');
}

async function issueTokens(user, req) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = getTokenExpiry(refreshToken);

  const activeRefreshTokens = user.refreshTokens
    .filter((token) => !token.revokedAt && token.expiresAt > new Date())
    .slice(-(MAX_REFRESH_TOKENS_PER_USER - 1));

  user.refreshTokens = [
    ...activeRefreshTokens,
    {
      tokenHash: refreshTokenHash,
      expiresAt,
      createdByIp: req?.ip,
    },
  ];

  await user.save();

  return { accessToken, refreshToken, expiresAt };
}

async function login({ identifier, password, req }) {
  const user = await findUserForLogin(identifier);
  assertActiveAccount(user);

  const isPasswordValid = await bcrypt.compare(password || '', user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  user.lastLoginAt = new Date();
  const tokens = await issueTokens(user, req);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

async function logout({ refreshToken }) {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashToken(refreshToken);
  const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash }).select('+refreshTokens +refreshTokens.tokenHash');

  if (!user) {
    return;
  }

  user.refreshTokens = user.refreshTokens.map((storedToken) => {
    if (storedToken.tokenHash === tokenHash && !storedToken.revokedAt) {
      storedToken.revokedAt = new Date();
    }

    return storedToken;
  });

  await user.save();
}

async function refreshAccessToken({ refreshToken, req }) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  const decoded = verifyRefreshToken(refreshToken);

  if (decoded.type !== 'refresh') {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const user = await User.findById(decoded.sub).select('+refreshTokens +refreshTokens.tokenHash');
  assertActiveAccount(user);

  const storedToken = user.refreshTokens.find(
    (candidate) => candidate.tokenHash === tokenHash && !candidate.revokedAt && candidate.expiresAt > new Date()
  );

  if (!storedToken) {
    throw new ApiError(401, 'Refresh token is invalid or expired');
  }

  storedToken.revokedAt = new Date();
  const tokens = await issueTokens(user, req);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

async function getProfile(userId) {
  const user = await User.findById(userId).populate('school', 'name code status academicYear');
  assertActiveAccount(user);

  return sanitizeUser(user);
}

async function changePassword({ userId, currentPassword, newPassword }) {
  if (!currentPassword) {
    throw new ApiError(400, 'Current password is required');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters');
  }

  const user = await User.findById(userId).select('+passwordHash +refreshTokens +refreshTokens.tokenHash');
  assertActiveAccount(user);

  const isPasswordValid = await bcrypt.compare(currentPassword || '', user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  user.refreshTokens = [];
  await user.save();

  return sanitizeUser(user);
}

async function createPasswordResetRequest(identifier) {
  const user = await findUserForLogin(identifier);

  if (!user) {
    return null;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpiresAt = addDays(new Date(), 1);
  await user.save();

  return {
    user: sanitizeUser(user),
    resetToken: rawToken,
  };
}

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(user, permission) {
  const permissions = new Set([...(user.permissions || []), ...getRolePermissions(user.role)]);
  return permissions.has(permission);
}

module.exports = {
  changePassword,
  createPasswordResetRequest,
  getProfile,
  getRolePermissions,
  hasPermission,
  login,
  logout,
  refreshAccessToken,
  sanitizeUser,
};
