const {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  assertObject,
  cleanPayload,
  createValidator,
  readDate,
  readEnum,
  readNumber,
  readObjectId,
  readString,
} = require('../utils/validation');
const ApiError = require('../utils/ApiError');

const GENDERS = ['female', 'male', 'other'];
const STATUSES = ['active', 'inactive', 'on_leave', 'terminated'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract'];

function sanitizeClassAssignment(value) {
  if (!value) return undefined;
  assertObject(value, 'classTeacherOf');
  return cleanPayload({
    className: readString(value, 'className', { max: 40 }),
    section: readString(value, 'section', { max: 10, uppercase: true }),
  });
}

function sanitizeArrayOfStrings(values, fieldName) {
  if (values === undefined) return undefined;
  if (!Array.isArray(values)) throw new ApiError(400, `${fieldName} must be an array`);
  return values.map((value) => String(value).trim()).filter(Boolean);
}

function sanitizeTeacher(body, { partial = false } = {}) {
  assertObject(body);
  return cleanPayload({
    school: readObjectId(body, 'school'),
    firstName: readString(body, 'firstName', { required: !partial, min: 2, max: 60 }),
    lastName: readString(body, 'lastName', { max: 60 }),
    email: readString(body, 'email', { max: 120, pattern: EMAIL_PATTERN, lowercase: true }),
    phone: readString(body, 'phone', { required: !partial, max: 20, pattern: PHONE_PATTERN }),
    gender: readEnum(body, 'gender', GENDERS),
    joiningDate: readDate(body, 'joiningDate'),
    subjects: sanitizeArrayOfStrings(body.subjects, 'subjects'),
    classTeacherOf: sanitizeClassAssignment(body.classTeacherOf),
    assignedClasses: body.assignedClasses?.map(sanitizeClassAssignment),
    employmentType: readEnum(body, 'employmentType', EMPLOYMENT_TYPES),
    status: readEnum(body, 'status', STATUSES),
    performance: body.performance,
    salaryRecords: body.salaryRecords,
    timetable: body.timetable,
  });
}

function sanitizeAttendance(body) {
  assertObject(body);
  return cleanPayload({
    present: readNumber(body, 'present', { min: 0 }),
    absent: readNumber(body, 'absent', { min: 0 }),
    leave: readNumber(body, 'leave', { min: 0 }),
  });
}

module.exports = {
  validateCreateTeacher: createValidator((body) => sanitizeTeacher(body)),
  validateTeacherAttendanceSummary: createValidator(sanitizeAttendance),
  validateUpdateTeacher: createValidator((body) => sanitizeTeacher(body, { partial: true })),
};
