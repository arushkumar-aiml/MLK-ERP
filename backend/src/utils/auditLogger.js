const mongoose = require('mongoose');

const { AuditLog } = require('../models');

async function logAuditEvent({ req, actor, school, action, status, metadata = {} }) {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    await AuditLog.create({
      actor: actor?._id || actor || undefined,
      school: school?._id || school || undefined,
      action,
      status,
      ipAddress: req?.ip,
      userAgent: req?.get?.('user-agent'),
      metadata,
    });
  } catch (error) {
    // Audit failure should not break the main auth flow, but it must be visible to operators.
    console.error('Failed to write audit log:', error);
  }
}

module.exports = { logAuditEvent };
