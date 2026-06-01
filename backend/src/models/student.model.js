const mongoose = require('mongoose');

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

const guardianSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Guardian name is required'],
      trim: true,
      maxlength: [100, 'Guardian name cannot exceed 100 characters'],
    },
    relation: {
      type: String,
      required: [true, 'Guardian relation is required'],
      trim: true,
      maxlength: [40, 'Guardian relation cannot exceed 40 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Guardian phone is required'],
      trim: true,
      match: [PHONE_PATTERN, 'Guardian phone number must be valid'],
    },
    alternatePhone: {
      type: String,
      trim: true,
      match: [PHONE_PATTERN, 'Alternate phone number must be valid'],
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      trim: true,
      uppercase: true,
      maxlength: [30, 'Admission number cannot exceed 30 characters'],
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
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['female', 'male', 'other'],
    },
    className: {
      type: String,
      required: [true, 'Class is required'],
      trim: true,
      maxlength: [40, 'Class cannot exceed 40 characters'],
      index: true,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [10, 'Section cannot exceed 10 characters'],
      default: 'A',
    },
    rollNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Roll number cannot exceed 20 characters'],
    },
    admissionDate: {
      type: Date,
      required: [true, 'Admission date is required'],
      default: Date.now,
    },
    guardian: {
      type: guardianSchema,
      required: [true, 'Guardian details are required'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'transferred', 'graduated'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

studentSchema.index({ school: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ school: 1, className: 1, section: 1, rollNumber: 1 });
studentSchema.index({ user: 1 }, { unique: true, sparse: true });
studentSchema.index({ school: 1, status: 1 });

module.exports = mongoose.model('Student', studentSchema);
