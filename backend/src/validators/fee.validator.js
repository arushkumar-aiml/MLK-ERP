const {
  ACADEMIC_YEAR_PATTERN,
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

function sanitizeLineItems(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new ApiError(400, 'lineItems must be a non-empty array');
  }

  return lineItems.map((item) => {
    assertObject(item, 'lineItem');
    return {
      category: readString(item, 'category', { required: true, max: 80 }),
      amount: readNumber(item, 'amount', { required: true, min: 0 }),
    };
  });
}

function sanitizePayment(body) {
  assertObject(body);
  return cleanPayload({
    school: readObjectId(body, 'school'),
    student: readObjectId(body, 'student', { required: true }),
    academicYear: readString(body, 'academicYear', { required: true, max: 9, pattern: ACADEMIC_YEAR_PATTERN }),
    dueDate: readDate(body, 'dueDate'),
    lineItems: sanitizeLineItems(body.lineItems),
    paidAmount: readNumber(body, 'paidAmount', { min: 0 }),
    method: readEnum(body, 'method', ['cash', 'card', 'upi', 'bank_transfer', 'cheque']),
    referenceNumber: readString(body, 'referenceNumber', { max: 80 }),
  });
}

module.exports = {
  validateCollectFee: createValidator(sanitizePayment),
};
