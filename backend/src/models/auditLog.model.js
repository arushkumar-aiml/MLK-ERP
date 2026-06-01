const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
      maxlength: [80, 'Audit action cannot exceed 80 characters'],
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: [true, 'Audit status is required'],
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ school: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
