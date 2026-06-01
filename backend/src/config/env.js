require('dotenv').config({ quiet: true });

const requiredVariables = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'NODE_ENV'];

const env = {
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
};

function validateEnv() {
  const missingVariables = requiredVariables.filter((key) => !process.env[key]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
  }

  if (!Number.isInteger(env.port) || env.port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  if (env.jwtSecret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters');
  }

  if (env.jwtRefreshSecret.length < 16) {
    throw new Error('JWT_REFRESH_SECRET must be at least 16 characters');
  }

  if (env.jwtSecret === env.jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values');
  }

  return env;
}

module.exports = {
  ...env,
  requiredVariables,
  validateEnv,
};
