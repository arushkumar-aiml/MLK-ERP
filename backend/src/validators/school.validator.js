const mongoose = require('mongoose');

const ApiError = require('../utils/ApiError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const ACADEMIC_YEAR_PATTERN = /^\d{4}-\d{4}$/;
const SCHOOL_CODE_PATTERN = /^[A-Z0-9_-]+$/;
const SCHOOL_STATUSES = ['active', 'inactive', 'suspended'];
const LOGO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

function assertObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, `${fieldName} must be an object`);
  }
}

function assertString(value, fieldName, { required = false, min = 0, max = 120, pattern, transform } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new ApiError(400, `${fieldName} is required`);
    }

    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const normalized = transform ? transform(value.trim()) : value.trim();

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

function assertObjectId(value, fieldName) {
  const normalized = assertString(value, fieldName, { required: true, max: 80 });

  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    throw new ApiError(400, `${fieldName} is invalid`);
  }

  return normalized;
}

function sanitizeAddress(address) {
  if (address === undefined) {
    return undefined;
  }

  assertObject(address, 'address');

  return {
    line1: assertString(address.line1, 'address.line1', { max: 120 }),
    line2: assertString(address.line2, 'address.line2', { max: 120 }),
    city: assertString(address.city, 'address.city', { max: 80 }),
    state: assertString(address.state, 'address.state', { max: 80 }),
    country: assertString(address.country, 'address.country', { max: 80 }),
    postalCode: assertString(address.postalCode, 'address.postalCode', { max: 20 }),
  };
}

function sanitizeSettings(settings) {
  if (settings === undefined) {
    return undefined;
  }

  assertObject(settings, 'settings');

  return {
    timezone: assertString(settings.timezone, 'settings.timezone', { max: 80 }),
    currency: assertString(settings.currency, 'settings.currency', {
      min: 3,
      max: 3,
      transform: (value) => value.toUpperCase(),
    }),
  };
}

function sanitizeLogo(logo) {
  if (logo === undefined) {
    return undefined;
  }

  assertObject(logo, 'logo');

  const mimeType = assertString(logo.mimeType, 'logo.mimeType', { max: 40 });

  if (mimeType && !LOGO_MIME_TYPES.includes(mimeType)) {
    throw new ApiError(400, 'logo.mimeType is not supported');
  }

  if (logo.size !== undefined && (!Number.isInteger(Number(logo.size)) || Number(logo.size) <= 0 || Number(logo.size) > 5242880)) {
    throw new ApiError(400, 'logo.size must be between 1 byte and 5 MB');
  }

  return {
    url: assertString(logo.url, 'logo.url', { max: 300 }),
    storageKey: assertString(logo.storageKey, 'logo.storageKey', { max: 180 }),
    mimeType,
    size: logo.size === undefined ? undefined : Number(logo.size),
  };
}

function sanitizeSchoolPayload(body, { partial = false } = {}) {
  assertObject(body, 'request body');

  const payload = {
    name: assertString(body.name, 'name', { required: !partial, min: 2, max: 120 }),
    code: partial
      ? undefined
      : assertString(body.code, 'code', {
          required: true,
          min: 2,
          max: 20,
          pattern: SCHOOL_CODE_PATTERN,
          transform: (value) => value.toUpperCase(),
        }),
    email: assertString(body.email, 'email', { max: 120, pattern: EMAIL_PATTERN, transform: (value) => value.toLowerCase() }),
    phone: assertString(body.phone, 'phone', { max: 20, pattern: PHONE_PATTERN }),
    academicYear: assertString(body.academicYear, 'academicYear', {
      required: !partial,
      max: 9,
      pattern: ACADEMIC_YEAR_PATTERN,
    }),
    address: sanitizeAddress(body.address),
    settings: sanitizeSettings(body.settings),
    logo: sanitizeLogo(body.logo),
  };

  if (body.status !== undefined) {
    payload.status = assertString(body.status, 'status', { max: 20 });

    if (!SCHOOL_STATUSES.includes(payload.status)) {
      throw new ApiError(400, 'status is invalid');
    }
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function validateCreateSchool(req, _res, next) {
  try {
    req.body = sanitizeSchoolPayload(req.body);
    next();
  } catch (error) {
    next(error);
  }
}

function validateUpdateSchool(req, _res, next) {
  try {
    req.body = sanitizeSchoolPayload(req.body, { partial: true });

    if (Object.keys(req.body).length === 0) {
      throw new ApiError(400, 'At least one editable school field is required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

function validateSchoolStatus(req, _res, next) {
  try {
    const status = assertString(req.body?.status, 'status', { required: true, max: 20 });

    if (!SCHOOL_STATUSES.includes(status)) {
      throw new ApiError(400, 'status is invalid');
    }

    req.body = { status };
    next();
  } catch (error) {
    next(error);
  }
}

function validatePrincipalAssignment(req, _res, next) {
  try {
    req.body = { principalId: assertObjectId(req.body?.principalId, 'principalId') };
    next();
  } catch (error) {
    next(error);
  }
}

function validateAdminAssignment(req, _res, next) {
  try {
    req.body = { adminId: assertObjectId(req.body?.adminId, 'adminId') };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateAdminAssignment,
  validateCreateSchool,
  validatePrincipalAssignment,
  validateSchoolStatus,
  validateUpdateSchool,
};
