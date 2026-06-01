const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [80, 'Subject name cannot exceed 80 characters'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks are required'],
      min: [1, 'Maximum marks must be greater than 0'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks are required'],
      min: [0, 'Passing marks cannot be negative'],
    },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
      maxlength: [120, 'Exam name cannot exceed 120 characters'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{4}$/, 'Academic year must use YYYY-YYYY format'],
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
    startsAt: {
      type: Date,
    },
    endsAt: {
      type: Date,
    },
    subjects: {
      type: [subjectSchema],
      required: [true, 'Exam subjects are required'],
      validate: {
        validator(subjects) {
          return Array.isArray(subjects) && subjects.length > 0;
        },
        message: 'At least one exam subject is required',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'completed', 'published'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true }
);

examSchema.index({ school: 1, academicYear: 1, className: 1, section: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Exam', examSchema);
