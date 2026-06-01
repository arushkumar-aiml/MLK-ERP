const mongoose = require('mongoose');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const LOGIN_ID_PATTERN = /^(SADM-\d{3}|ADM-[A-Z0-9]+-\d{3}|PRI-[A-Z0-9]+-\d{3}|TCH-[A-Z0-9]+-\d{3}|STD-[A-Z0-9]+-\d{4}-\d{3})$/;

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdByIp: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    revokedAt: {
      type: Date,
    },
  },
  { _id: false, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required() {
        return this.role !== 'superadmin';
      },
      index: true,
    },
    loginId: {
      type: String,
      required: [true, 'Login ID is required'],
      trim: true,
      uppercase: true,
      match: [LOGIN_ID_PATTERN, 'Login ID format is invalid'],
      unique: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [40, 'Username cannot exceed 40 characters'],
      match: [/^[a-z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, and hyphens'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [60, 'First name cannot exceed 60 characters'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [60, 'Last name cannot exceed 60 characters'],
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [120, 'Email cannot exceed 120 characters'],
      match: [EMAIL_PATTERN, 'Email must be valid'],
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_PATTERN, 'Phone number must be valid'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      minlength: [20, 'Password hash is too short'],
      select: false,
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: ['superadmin', 'admin', 'principal', 'teacher', 'student'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'inactive', 'locked', 'suspended'],
      default: 'active',
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator(permissions) {
          return permissions.every((permission) => /^[a-z]+:[a-z]+$/.test(permission));
        },
        message: 'Permissions must use module:action format',
      },
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ school: 1, email: 1 }, { unique: true, partialFilterExpression: { school: { $exists: true } } });
userSchema.index({ school: 1, role: 1, status: 1 });
userSchema.index({ school: 1, phone: 1 }, { sparse: true });
userSchema.index({ 'refreshTokens.expiresAt': 1 });

module.exports = mongoose.model('User', userSchema);
