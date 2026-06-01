const jwt = require('jsonwebtoken');

const env = require('../config/env');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function getJwtSecret() {
  const secret = env.jwtSecret;

  if (!secret || secret === 'change-me') {
    throw new Error('JWT_SECRET must be set to a strong value before using authentication');
  }

  return secret;
}

function getJwtRefreshSecret() {
  const secret = env.jwtRefreshSecret;

  if (!secret || secret === 'change-me-refresh') {
    throw new Error('JWT_REFRESH_SECRET must be set to a strong value before using refresh tokens');
  }

  return secret;
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      school: user.school ? user.school.toString() : null,
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      type: 'refresh',
    },
    getJwtRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getJwtRefreshSecret());
}

function verifyToken(token) {
  return verifyAccessToken(token);
}

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
};
