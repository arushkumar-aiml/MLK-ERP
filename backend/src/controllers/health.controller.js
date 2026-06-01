const env = require('../config/env');

function getHealth(_req, res) {
  res.json({
    success: true,
    message: 'MLK ERP API Running',
    environment: env.nodeEnv,
  });
}

module.exports = { getHealth };
