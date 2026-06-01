const mongoose = require('mongoose');

const markSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [80, 'Subject cannot exceed 80 characters'],
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained are required'],
      min: [0, 'Marks obtained cannot be negative'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks are required'],
      min: [1, 'Maximum marks must be greater than 0'],
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
      index: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam is required'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
      index: true,
    },
    marks: {
      type: [markSchema],
      required: [true, 'Marks are required'],
      validate: {
        validator(marks) {
          return Array.isArray(marks) && marks.length > 0;
        },
        message: 'At least one mark entry is required',
      },
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rank: {
      type: Number,
      min: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true }
);

resultSchema.index({ school: 1, exam: 1, student: 1 }, { unique: true });
resultSchema.index({ school: 1, student: 1, createdAt: -1 });

module.exports = mongoose.model('Result', resultSchema);
