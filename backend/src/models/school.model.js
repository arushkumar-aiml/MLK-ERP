const mongoose = require('mongoose');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const ACADEMIC_YEAR_PATTERN = /^\d{4}-\d{4}$/;

const addressSchema = new mongoose.Schema(
  {
    line1: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    line2: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    country: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'India',
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20,
    },
  },
  { _id: false }
);

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
      minlength: [2, 'School name must be at least 2 characters'],
      maxlength: [120, 'School name cannot exceed 120 characters'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'School code is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'School code must be at least 2 characters'],
      maxlength: [20, 'School code cannot exceed 20 characters'],
      match: [/^[A-Z0-9_-]+$/, 'School code can only contain letters, numbers, underscores, and hyphens'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [120, 'School email cannot exceed 120 characters'],
      match: [EMAIL_PATTERN, 'School email must be valid'],
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_PATTERN, 'School phone number must be valid'],
    },
    address: addressSchema,
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      match: [ACADEMIC_YEAR_PATTERN, 'Academic year must use YYYY-YYYY format'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    settings: {
      timezone: {
        type: String,
        trim: true,
        default: 'Asia/Kolkata',
      },
      currency: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: 3,
        maxlength: 3,
        default: 'INR',
      },
    },
  },
  { timestamps: true }
);

schoolSchema.index({ email: 1 }, { unique: true, sparse: true });
schoolSchema.index({ status: 1, name: 1 });

module.exports = mongoose.model('School', schoolSchema);
