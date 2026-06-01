const mongoose = require('mongoose');

const { School, Student } = require('../models');
const ApiError = require('../utils/ApiError');
const generateLoginId = require('../utils/generateLoginId');
const { buildSchoolScope, resolveSchoolForWrite } = require('./scope.service');
const { getNextSequence } = require('./sequence.service');

const ALLOWED_FIELDS = [
  'registrationNumber',
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'className',
  'section',
  'rollNumber',
  'admissionDate',
  'guardian',
  'aadhaarNumber',
  'photo',
  'documents',
  'address',
  'status',
];

function ensureObjectId(id, resourceName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `${resourceName} ID is invalid`);
  }
}

function pickAllowedFields(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => ALLOWED_FIELDS.includes(key)));
}

function buildStudentQuery(filters, user) {
  const query = buildSchoolScope(user, filters.school);

  if (filters.status) query.status = filters.status;
  if (filters.className) query.className = filters.className;
  if (filters.section) query.section = String(filters.section).toUpperCase();

  if (filters.search) {
    const escaped = String(filters.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { firstName: { $regex: escaped, $options: 'i' } },
      { lastName: { $regex: escaped, $options: 'i' } },
      { admissionNumber: { $regex: escaped, $options: 'i' } },
      { registrationNumber: { $regex: escaped, $options: 'i' } },
      { 'guardian.name': { $regex: escaped, $options: 'i' } },
      { 'guardian.phone': { $regex: escaped, $options: 'i' } },
    ];
  }

  return query;
}

async function generateStudentId(schoolId, admissionDate) {
  const school = await School.findById(schoolId).select('code');

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  const year = String((admissionDate ? new Date(admissionDate) : new Date()).getFullYear());
  const prefix = `STD-${school.code}-${year}`;
  const sequence = await getNextSequence(Student, { school: schoolId, admissionNumber: { $regex: `^${prefix}-` } }, 'admissionNumber');

  return generateLoginId({ role: 'student', schoolCode: school.code, year, sequence });
}

async function createStudent(payload, user) {
  const school = resolveSchoolForWrite(user, payload.school);
  const studentPayload = pickAllowedFields(payload);
  const admissionNumber = await generateStudentId(school, studentPayload.admissionDate);

  return Student.create({
    ...studentPayload,
    school,
    admissionNumber,
    registrationNumber: studentPayload.registrationNumber || admissionNumber,
  });
}

async function listStudents(filters, user) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const query = buildStudentQuery(filters, user);

  const [students, total] = await Promise.all([
    Student.find(query).select('+aadhaarNumber').populate('school', 'name code').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Student.countDocuments(query),
  ]);

  return {
    students,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getStudentById(id, user) {
  ensureObjectId(id, 'Student');
  const schoolScope = buildSchoolScope(user);
  const student = await Student.findOne({ _id: id, ...schoolScope }).select('+aadhaarNumber').populate('school', 'name code status');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return student;
}

async function updateStudent(id, payload, user) {
  ensureObjectId(id, 'Student');
  const schoolScope = buildSchoolScope(user, undefined, { write: true });
  const updatePayload = pickAllowedFields(payload);

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, 'At least one editable student field is required');
  }

  const student = await Student.findOneAndUpdate({ _id: id, ...schoolScope }, { $set: updatePayload }, { new: true, runValidators: true }).select(
    '+aadhaarNumber'
  );

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return student;
}

async function deleteStudent(id, user) {
  ensureObjectId(id, 'Student');
  const schoolScope = buildSchoolScope(user, undefined, { write: true });
  const student = await Student.findOneAndUpdate({ _id: id, ...schoolScope }, { $set: { status: 'inactive' } }, { new: true });

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return student;
}

async function promoteStudents(payload, user) {
  const scope = buildSchoolScope(user, payload.school, { write: true });
  const query = { ...scope, status: 'active' };

  if (payload.studentIds) {
    if (!Array.isArray(payload.studentIds) || payload.studentIds.length === 0) {
      throw new ApiError(400, 'studentIds must be a non-empty array');
    }
    query._id = { $in: payload.studentIds };
  }

  if (payload.fromClassName) query.className = payload.fromClassName;
  if (payload.fromSection) query.section = payload.fromSection;

  const students = await Student.find(query);

  await Promise.all(
    students.map((student) => {
      student.previousClassName = student.className;
      student.previousSection = student.section;
      student.className = payload.toClassName;
      student.section = payload.toSection || student.section;
      student.promotedAt = new Date();
      return student.save();
    })
  );

  return { promoted: students.length };
}

async function transferStudent(payload, user) {
  const student = await getStudentById(payload.studentId, user);
  const targetSchool = await School.findById(payload.targetSchool).select('code');

  if (!targetSchool) {
    throw new ApiError(404, 'Target school not found');
  }

  student.school = targetSchool._id;
  student.className = payload.className || student.className;
  student.section = payload.section || student.section;
  student.status = 'transferred';
  student.transferDate = payload.transferDate || new Date();
  student.admissionNumber = await generateStudentId(targetSchool._id, student.transferDate);
  await student.save();

  return student;
}

module.exports = {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  promoteStudents,
  transferStudent,
  updateStudent,
};
