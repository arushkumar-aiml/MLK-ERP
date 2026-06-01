const mongoose = require('mongoose');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

const classTeacherSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      trim: true,
      maxlength: [40, 'Class cannot exceed 40 characters'],
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [10, 'Section cannot exceed 10 characters'],
    },
  },
  { _id: false }
);

const teacherSchema = new mongoose.Schema(
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
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      uppercase: true,
      maxlength: [30, 'Employee ID cannot exceed 30 characters'],
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
      trim: true,
      lowercase: true,
      maxlength: [120, 'Email cannot exceed 120 characters'],
      match: [EMAIL_PATTERN, 'Email must be valid'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      match: [PHONE_PATTERN, 'Phone number must be valid'],
    },
    gender: {
      type: String,
      enum: ['female', 'male', 'other'],
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now,
    },
    subjects: {
      type: [String],
      default: [],
      validate: {
        validator(subjects) {
          return subjects.every((subject) => subject.trim().length > 0 && subject.length <= 60);
        },
        message: 'Subjects must be non-empty and 60 characters or fewer',
      },
    },
    classTeacherOf: classTeacherSchema,
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract'],
      default: 'full_time',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'terminated'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

teacherSchema.index({ school: 1, employeeId: 1 }, { unique: true });
teacherSchema.index(
  { school: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);
teacherSchema.index({ user: 1 }, { unique: true, sparse: true });
teacherSchema.index({ school: 1, status: 1 });
teacherSchema.index({ school: 1, 'classTeacherOf.className': 1, 'classTeacherOf.section': 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
