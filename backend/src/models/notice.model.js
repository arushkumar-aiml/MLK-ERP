const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: [160, 'Notice title cannot exceed 160 characters'],
    },
    body: {
      type: String,
      required: [true, 'Notice body is required'],
      trim: true,
      maxlength: [3000, 'Notice body cannot exceed 3000 characters'],
    },
    audience: {
      type: String,
      enum: ['school', 'parents', 'teachers', 'emergency'],
      required: [true, 'Notice audience is required'],
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal',
    },
    expiresAt: {
      type: Date,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
  },
  { timestamps: true }
);

noticeSchema.index({ school: 1, audience: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
