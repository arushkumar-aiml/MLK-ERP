const { ACADEMIC_YEAR_PATTERN, assertObject, cleanPayload, createValidator, readDate, readEnum, readNumber, readObjectId, readString } = require('../utils/validation');
const ApiError = require('../utils/ApiError');

function sanitizeSubjects(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) throw new ApiError(400, 'subjects must be a non-empty array');
  return subjects.map((subject) => {
    assertObject(subject, 'subject');
    return {
      name: readString(subject, 'name', { required: true, max: 80 }),
      maxMarks: readNumber(subject, 'maxMarks', { required: true, min: 1 }),
      passingMarks: readNumber(subject, 'passingMarks', { required: true, min: 0 }),
    };
  });
}

function sanitizeExam(body) {
  assertObject(body);
  return cleanPayload({
    school: readObjectId(body, 'school'),
    name: readString(body, 'name', { required: true, max: 120 }),
    academicYear: readString(body, 'academicYear', { required: true, max: 9, pattern: ACADEMIC_YEAR_PATTERN }),
    className: readString(body, 'className', { required: true, max: 40 }),
    section: readString(body, 'section', { max: 10, uppercase: true }),
    startsAt: readDate(body, 'startsAt'),
    endsAt: readDate(body, 'endsAt'),
    subjects: sanitizeSubjects(body.subjects),
    status: readEnum(body, 'status', ['draft', 'scheduled', 'completed', 'published']),
  });
}

function sanitizeMarks(marks) {
  if (!Array.isArray(marks) || marks.length === 0) throw new ApiError(400, 'marks must be a non-empty array');
  return marks.map((mark) => {
    assertObject(mark, 'mark');
    return {
      subject: readString(mark, 'subject', { required: true, max: 80 }),
      marksObtained: readNumber(mark, 'marksObtained', { required: true, min: 0 }),
      maxMarks: readNumber(mark, 'maxMarks', { required: true, min: 1 }),
    };
  });
}

function sanitizeResult(body) {
  assertObject(body);
  return cleanPayload({
    school: readObjectId(body, 'school'),
    exam: readObjectId(body, 'exam', { required: true }),
    student: readObjectId(body, 'student', { required: true }),
    marks: sanitizeMarks(body.marks),
    status: readEnum(body, 'status', ['draft', 'published']),
  });
}

module.exports = {
  validateCreateExam: createValidator(sanitizeExam),
  validateResult: createValidator(sanitizeResult),
};
