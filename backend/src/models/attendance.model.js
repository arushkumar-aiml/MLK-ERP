const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
      index: true,
    },
    entityType: {
      type: String,
      required: [true, 'Attendance entity type is required'],
      enum: ['student', 'teacher'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Attendance status is required'],
      enum: ['present', 'absent', 'late', 'half_day', 'leave'],
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [250, 'Attendance remarks cannot exceed 250 characters'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ school: 1, entityType: 1, date: 1 });
attendanceSchema.index({ school: 1, student: 1, date: 1 }, { unique: true, sparse: true });
attendanceSchema.index({ school: 1, teacher: 1, date: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
