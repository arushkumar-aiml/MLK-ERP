const {
  ACADEMIC_YEAR_PATTERN,
  PHONE_PATTERN,
  assertObject,
  cleanPayload,
  createValidator,
  readDate,
  readEnum,
  readObjectId,
  readString,
} = require('../utils/validation');
const ApiError = require('../utils/ApiError');

const GENDERS = ['female', 'male', 'other'];
const STATUSES = ['active', 'inactive', 'transferred', 'graduated'];

function sanitizeGuardian(guardian, required = false) {
  if (!guardian) {
    if (required) throw new ApiError(400, 'guardian is required');
    return undefined;
  }

  assertObject(guardian, 'guardian');

  return cleanPayload({
    name: readString(guardian, 'name', { required: true, min: 2, max: 100 }),
    relation: readString(guardian, 'relation', { required: true, max: 40 }),
    phone: readString(guardian, 'phone', { required: true, max: 20, pattern: PHONE_PATTERN }),
    alternatePhone: readString(guardian, 'alternatePhone', { max: 20, pattern: PHONE_PATTERN }),
  });
}

function sanitizePhoto(photo) {
  if (!photo) return undefined;
  assertObject(photo, 'photo');
  return cleanPayload({
    url: readString(photo, 'url', { max: 300 }),
    storageKey: readString(photo, 'storageKey', { max: 180 }),
    uploadedAt: readDate(photo, 'uploadedAt'),
  });
}

function sanitizeDocuments(documents) {
  if (documents === undefined) return undefined;
  if (!Array.isArray(documents)) throw new ApiError(400, 'documents must be an array');

  return documents.map((document) => {
    assertObject(document, 'document');
    return cleanPayload({
      type: readString(document, 'type', { required: true, max: 60 }),
      title: readString(document, 'title', { max: 120 }),
      url: readString(document, 'url', { required: true, max: 300 }),
      storageKey: readString(document, 'storageKey', { max: 180 }),
      uploadedAt: readDate(document, 'uploadedAt'),
    });
  });
}

function sanitizeStudent(body, { partial = false } = {}) {
  assertObject(body);

  return cleanPayload({
    school: readObjectId(body, 'school'),
    registrationNumber: readString(body, 'registrationNumber', { max: 30, uppercase: true }),
    firstName: readString(body, 'firstName', { required: !partial, min: 2, max: 60 }),
    lastName: readString(body, 'lastName', { max: 60 }),
    dateOfBirth: readDate(body, 'dateOfBirth', { required: !partial }),
    gender: readEnum(body, 'gender', GENDERS, { required: !partial }),
    className: readString(body, 'className', { required: !partial, max: 40 }),
    section: readString(body, 'section', { max: 10, uppercase: true }),
    rollNumber: readString(body, 'rollNumber', { max: 20 }),
    admissionDate: readDate(body, 'admissionDate'),
    guardian: sanitizeGuardian(body.guardian, !partial),
    aadhaarNumber: readString(body, 'aadhaarNumber', { max: 12, pattern: /^\d{12}$/ }),
    photo: sanitizePhoto(body.photo),
    documents: sanitizeDocuments(body.documents),
    address: readString(body, 'address', { max: 250 }),
    status: readEnum(body, 'status', STATUSES),
  });
}

function validatePromote(body) {
  assertObject(body);
  return cleanPayload({
    school: readObjectId(body, 'school'),
    studentIds: body.studentIds,
    fromClassName: readString(body, 'fromClassName', { max: 40 }),
    fromSection: readString(body, 'fromSection', { max: 10, uppercase: true }),
    toClassName: readString(body, 'toClassName', { required: true, max: 40 }),
    toSection: readString(body, 'toSection', { max: 10, uppercase: true }),
    academicYear: readString(body, 'academicYear', { max: 9, pattern: ACADEMIC_YEAR_PATTERN }),
  });
}

function validateTransfer(body) {
  assertObject(body);
  return cleanPayload({
    studentId: readObjectId(body, 'studentId', { required: true }),
    targetSchool: readObjectId(body, 'targetSchool', { required: true }),
    className: readString(body, 'className', { max: 40 }),
    section: readString(body, 'section', { max: 10, uppercase: true }),
    transferDate: readDate(body, 'transferDate'),
  });
}

module.exports = {
  validateCreateStudent: createValidator((body) => sanitizeStudent(body)),
  validatePromoteStudents: createValidator(validatePromote),
  validateTransferStudent: createValidator(validateTransfer),
  validateUpdateStudent: createValidator((body) => sanitizeStudent(body, { partial: true })),
};
