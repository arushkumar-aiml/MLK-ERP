const mongoose = require('mongoose');

const { School, Teacher } = require('../models');
const ApiError = require('../utils/ApiError');
const generateLoginId = require('../utils/generateLoginId');
const { buildSchoolScope, resolveSchoolForWrite } = require('./scope.service');
const { getNextSequence } = require('./sequence.service');

const ALLOWED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'gender',
  'joiningDate',
  'subjects',
  'classTeacherOf',
  'assignedClasses',
  'employmentType',
  'status',
  'performance',
  'salaryRecords',
  'timetable',
  'attendanceSummary',
];

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Teacher ID is invalid');
  }
}

function pickAllowedFields(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => ALLOWED_FIELDS.includes(key)));
}

async function generateTeacherId(schoolId) {
  const school = await School.findById(schoolId).select('code');
  if (!school) throw new ApiError(404, 'School not found');
  const prefix = `TCH-${school.code}`;
  const sequence = await getNextSequence(Teacher, { school: schoolId, employeeId: { $regex: `^${prefix}-` } }, 'employeeId');
  return generateLoginId({ role: 'teacher', schoolCode: school.code, sequence });
}

function buildTeacherQuery(filters, user) {
  const query = buildSchoolScope(user, filters.school);
  if (filters.status) query.status = filters.status;
  if (filters.subject) query.subjects = filters.subject;
  if (filters.className) query['classTeacherOf.className'] = filters.className;
  if (filters.search) {
    const escaped = String(filters.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { firstName: { $regex: escaped, $options: 'i' } },
      { lastName: { $regex: escaped, $options: 'i' } },
      { employeeId: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { phone: { $regex: escaped, $options: 'i' } },
    ];
  }
  return query;
}

async function createTeacher(payload, user) {
  const school = resolveSchoolForWrite(user, payload.school);
  const teacherPayload = pickAllowedFields(payload);
  const employeeId = await generateTeacherId(school);
  return Teacher.create({ ...teacherPayload, school, employeeId });
}

async function listTeachers(filters, user) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const query = buildTeacherQuery(filters, user);
  const [teachers, total] = await Promise.all([
    Teacher.find(query).populate('school', 'name code').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Teacher.countDocuments(query),
  ]);
  return { teachers, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

async function getTeacherById(id, user) {
  ensureObjectId(id);
  const teacher = await Teacher.findOne({ _id: id, ...buildSchoolScope(user) }).populate('school', 'name code status');
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return teacher;
}

async function updateTeacher(id, payload, user) {
  ensureObjectId(id);
  const updatePayload = pickAllowedFields(payload);
  if (Object.keys(updatePayload).length === 0) throw new ApiError(400, 'At least one editable teacher field is required');
  const teacher = await Teacher.findOneAndUpdate({ _id: id, ...buildSchoolScope(user, undefined, { write: true }) }, { $set: updatePayload }, { new: true, runValidators: true });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return teacher;
}

async function deleteTeacher(id, user) {
  ensureObjectId(id);
  const teacher = await Teacher.findOneAndUpdate({ _id: id, ...buildSchoolScope(user, undefined, { write: true }) }, { $set: { status: 'terminated' } }, { new: true });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return teacher;
}

module.exports = {
  createTeacher,
  deleteTeacher,
  getTeacherById,
  listTeachers,
  updateTeacher,
};
