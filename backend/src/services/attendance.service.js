const { Attendance, Student, Teacher } = require('../models');
const ApiError = require('../utils/ApiError');
const { buildSchoolScope, resolveSchoolForWrite } = require('./scope.service');

async function markAttendance(payload, user) {
  const school = resolveSchoolForWrite(user, payload.school);

  if (payload.entityType === 'student') {
    if (!payload.student) throw new ApiError(400, 'student is required');
    const exists = await Student.exists({ _id: payload.student, school });
    if (!exists) throw new ApiError(404, 'Student not found in selected school');
  }

  if (payload.entityType === 'teacher') {
    if (!payload.teacher) throw new ApiError(400, 'teacher is required');
    const exists = await Teacher.exists({ _id: payload.teacher, school });
    if (!exists) throw new ApiError(404, 'Teacher not found in selected school');
  }

  const identity = payload.entityType === 'student' ? { student: payload.student } : { teacher: payload.teacher };

  return Attendance.findOneAndUpdate(
    { school, entityType: payload.entityType, date: payload.date, ...identity },
    { $set: { ...payload, school, markedBy: user._id } },
    { new: true, upsert: true, runValidators: true }
  );
}

async function listAttendance(filters, user) {
  const query = buildSchoolScope(user, filters.school);
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.status) query.status = filters.status;
  if (filters.student) query.student = filters.student;
  if (filters.teacher) query.teacher = filters.teacher;
  if (filters.from || filters.to) {
    query.date = {};
    if (filters.from) query.date.$gte = new Date(filters.from);
    if (filters.to) query.date.$lte = new Date(filters.to);
  }

  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const [attendance, total] = await Promise.all([
    Attendance.find(query).populate('student', 'admissionNumber firstName lastName').populate('teacher', 'employeeId firstName lastName').sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
    Attendance.countDocuments(query),
  ]);
  return { attendance, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

async function getAttendanceReports(filters, user) {
  const match = buildSchoolScope(user, filters.school);
  if (filters.entityType) match.entityType = filters.entityType;
  if (filters.from || filters.to) {
    match.date = {};
    if (filters.from) match.date.$gte = new Date(filters.from);
    if (filters.to) match.date.$lte = new Date(filters.to);
  }

  const rows = await Attendance.aggregate([{ $match: match }, { $group: { _id: { entityType: '$entityType', status: '$status' }, count: { $sum: 1 } } }]);
  return rows;
}

module.exports = {
  getAttendanceReports,
  listAttendance,
  markAttendance,
};
