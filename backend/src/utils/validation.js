const mongoose = require('mongoose');

const ApiError = require('./ApiError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const ACADEMIC_YEAR_PATTERN = /^\d{4}-\d{4}$/;

function assertObject(value, fieldName = 'request body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, `${fieldName} must be an object`);
  }
}

function readString(source, fieldName, options = {}) {
  const { required = false, min = 0, max = 120, pattern, lowercase = false, uppercase = false } = options;
  const value = source?.[fieldName];

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new ApiError(400, `${fieldName} is required`);
    }

    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  let normalized = value.trim();

  if (lowercase) normalized = normalized.toLowerCase();
  if (uppercase) normalized = normalized.toUpperCase();

  if (normalized.length < min) {
    throw new ApiError(400, `${fieldName} must be at least ${min} characters`);
  }

  if (normalized.length > max) {
    throw new ApiError(400, `${fieldName} cannot exceed ${max} characters`);
  }

  if (pattern && !pattern.test(normalized)) {
    throw new ApiError(400, `${fieldName} is invalid`);
  }

  return normalized;
}

function readNumber(source, fieldName, options = {}) {
  const { required = false, min, max } = options;
  const value = source?.[fieldName];

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new ApiError(400, `${fieldName} is required`);
    }

    return undefined;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new ApiError(400, `${fieldName} must be a number`);
  }

  if (min !== undefined && numberValue < min) {
    throw new ApiError(400, `${fieldName} cannot be less than ${min}`);
  }

  if (max !== undefined && numberValue > max) {
    throw new ApiError(400, `${fieldName} cannot exceed ${max}`);
  }

  return numberValue;
}

function readDate(source, fieldName, { required = false } = {}) {
  const value = source?.[fieldName];

  if (!value) {
    if (required) {
      throw new ApiError(400, `${fieldName} is required`);
    }

    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  return date;
}

function readObjectId(source, fieldName, { required = false } = {}) {
  const value = readString(source, fieldName, { required, max: 80 });

  if (!value) {
    return undefined;
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `${fieldName} is invalid`);
  }

  return value;
}

function readEnum(source, fieldName, values, { required = false } = {}) {
  const value = readString(source, fieldName, { required, max: 40 });

  if (!value) {
    return undefined;
  }

  if (!values.includes(value)) {
    throw new ApiError(400, `${fieldName} is invalid`);
  }

  return value;
}

function cleanPayload(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function createValidator(sanitizer) {
  return (req, _res, next) => {
    try {
      req.body = sanitizer(req.body || {});
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  ACADEMIC_YEAR_PATTERN,
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
};
