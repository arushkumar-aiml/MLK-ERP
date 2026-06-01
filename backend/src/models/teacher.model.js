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

const attendanceSummarySchema = new mongoose.Schema(
  {
    present: {
      type: Number,
      default: 0,
      min: 0,
    },
    absent: {
      type: Number,
      default: 0,
      min: 0,
    },
    leave: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const performanceSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Performance notes cannot exceed 500 characters'],
    },
    reviewedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const salaryRecordSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: [true, 'Salary month is required'],
      match: [/^\d{4}-\d{2}$/, 'Salary month must use YYYY-MM format'],
    },
    amount: {
      type: Number,
      required: [true, 'Salary amount is required'],
      min: [0, 'Salary amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
  },
  { _id: true }
);

const timetableAssignmentSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: [true, 'Timetable day is required'],
    },
    className: {
      type: String,
      required: [true, 'Timetable class is required'],
      trim: true,
      maxlength: [40, 'Timetable class cannot exceed 40 characters'],
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [10, 'Timetable section cannot exceed 10 characters'],
      default: 'A',
    },
    subject: {
      type: String,
      required: [true, 'Timetable subject is required'],
      trim: true,
      maxlength: [60, 'Timetable subject cannot exceed 60 characters'],
    },
    period: {
      type: Number,
      required: [true, 'Timetable period is required'],
      min: 1,
      max: 12,
    },
  },
  { _id: true }
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
    assignedClasses: {
      type: [classTeacherSchema],
      default: [],
    },
    attendanceSummary: {
      type: attendanceSummarySchema,
      default: () => ({}),
    },
    performance: performanceSchema,
    salaryRecords: {
      type: [salaryRecordSchema],
      default: [],
    },
    timetable: {
      type: [timetableAssignmentSchema],
      default: [],
    },
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
