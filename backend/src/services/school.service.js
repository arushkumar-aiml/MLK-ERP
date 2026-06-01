const mongoose = require('mongoose');

const { School, User } = require('../models');
const ApiError = require('../utils/ApiError');

const ALLOWED_CREATE_FIELDS = ['name', 'code', 'email', 'phone', 'address', 'academicYear', 'status', 'settings'];
const ALLOWED_UPDATE_FIELDS = ['name', 'email', 'phone', 'address', 'academicYear', 'status', 'settings'];

function pickAllowedFields(source, allowedFields) {
  return allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      payload[field] = source[field];
    }

    return payload;
  }, {});
}

function ensureValidObjectId(id, resourceName = 'Resource') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `${resourceName} ID is invalid`);
  }
}

function buildSchoolQuery({ search, status }) {
  const query = {};

  if (status) {
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      throw new ApiError(400, 'School status filter is invalid');
    }

    query.status = status;
  }

  if (search) {
    const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { code: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  return query;
}

async function listSchools({ page = 1, limit = 20, search, status }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;
  const query = buildSchoolQuery({ search, status });

  const [schools, total] = await Promise.all([
    School.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    School.countDocuments(query),
  ]);

  return {
    schools,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function getSchoolById(id) {
  ensureValidObjectId(id, 'School');

  const school = await School.findById(id);

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  return school;
}

async function createSchool(payload) {
  const schoolPayload = pickAllowedFields(payload, ALLOWED_CREATE_FIELDS);

  if (Object.keys(schoolPayload).length === 0) {
    throw new ApiError(400, 'School payload is required');
  }

  return School.create(schoolPayload);
}

async function updateSchool(id, payload) {
  ensureValidObjectId(id, 'School');

  const schoolPayload = pickAllowedFields(payload, ALLOWED_UPDATE_FIELDS);

  if (Object.keys(schoolPayload).length === 0) {
    throw new ApiError(400, 'At least one editable school field is required');
  }

  const school = await School.findByIdAndUpdate(id, { $set: schoolPayload }, { new: true, runValidators: true });

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  return school;
}

async function deleteSchool(id) {
  ensureValidObjectId(id, 'School');

  const linkedUsers = await User.countDocuments({ school: id });

  if (linkedUsers > 0) {
    throw new ApiError(409, 'School cannot be deleted while users are linked to it');
  }

  const school = await School.findByIdAndDelete(id);

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  return school;
}

module.exports = {
  createSchool,
  deleteSchool,
  getSchoolById,
  listSchools,
  updateSchool,
};
