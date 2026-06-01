const { assertObject, cleanPayload, createValidator, readDate, readEnum, readObjectId, readString } = require('../utils/validation');

function sanitizeAttendance(body) {
  assertObject(body);
  return cleanPayload({
    school: readObjectId(body, 'school'),
    entityType: readEnum(body, 'entityType', ['student', 'teacher'], { required: true }),
    student: readObjectId(body, 'student'),
    teacher: readObjectId(body, 'teacher'),
    date: readDate(body, 'date', { required: true }),
    status: readEnum(body, 'status', ['present', 'absent', 'late', 'half_day', 'leave'], { required: true }),
    remarks: readString(body, 'remarks', { max: 250 }),
  });
}

module.exports = {
  validateAttendance: createValidator(sanitizeAttendance),
};
