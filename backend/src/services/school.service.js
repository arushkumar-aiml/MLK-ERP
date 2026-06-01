const mongoose = require('mongoose');

const { AuditLog, School, Student, Teacher, User } = require('../models');
const ApiError = require('../utils/ApiError');

const ALLOWED_CREATE_FIELDS = ['name', 'code', 'email', 'phone', 'address', 'academicYear', 'status', 'settings', 'logo'];
const ALLOWED_UPDATE_FIELDS = ['name', 'email', 'phone', 'address', 'academicYear', 'status', 'settings', 'logo'];
const SCHOOL_STATUSES = ['active', 'inactive', 'suspended'];
const READ_ROLES = ['superadmin', 'admin', 'principal'];

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

function ensureCanReadSchools(user) {
  if (!user || !READ_ROLES.includes(user.role)) {
    throw new ApiError(403, 'You do not have access to school management');
  }
}

function buildScopedQuery(user) {
  if (user.role === 'superadmin') {
    return {};
  }

  if (!user.school?._id && !user.school) {
    throw new ApiError(403, 'No school is assigned to this account');
  }

  return { _id: user.school._id || user.school };
}

function buildSchoolQuery({ search, status }, user) {
  const query = {};
  const scopedQuery = buildScopedQuery(user);

  if (status) {
    if (!SCHOOL_STATUSES.includes(status)) {
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

  return { ...query, ...scopedQuery };
}

function withSchoolPopulation(query) {
  return query.populate('principal', 'loginId firstName lastName email phone role status').populate('admins', 'loginId firstName lastName email phone role status');
}

async function ensureDuplicateSchoolDoesNotExist({ code, name, email }, existingSchoolId) {
  const duplicateChecks = [];

  if (code) {
    duplicateChecks.push({ code: String(code).toUpperCase() });
  }

  if (name) {
    duplicateChecks.push({ name: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  }

  if (email) {
    duplicateChecks.push({ email: String(email).toLowerCase() });
  }

  if (duplicateChecks.length === 0) {
    return;
  }

  const query = { $or: duplicateChecks };

  if (existingSchoolId) {
    query._id = { $ne: existingSchoolId };
  }

  const duplicate = await School.findOne(query).select('code name email');

  if (!duplicate) {
    return;
  }

  if (code && duplicate.code === String(code).toUpperCase()) {
    throw new ApiError(409, 'School code already exists');
  }

  if (email && duplicate.email === String(email).toLowerCase()) {
    throw new ApiError(409, 'School email already exists');
  }

  throw new ApiError(409, 'School name already exists');
}

async function listSchools({ page = 1, limit = 20, search, status }, user) {
  ensureCanReadSchools(user);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;
  const query = buildSchoolQuery({ search, status }, user);

  const [schools, total] = await Promise.all([
    withSchoolPopulation(School.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit)),
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

async function getSchoolById(id, user) {
  ensureCanReadSchools(user);
  ensureValidObjectId(id, 'School');

  const scopedQuery = buildScopedQuery(user);

  if (scopedQuery._id && String(scopedQuery._id) !== String(id)) {
    throw new ApiError(404, 'School not found');
  }

  const school = await withSchoolPopulation(School.findById(id));

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

  await ensureDuplicateSchoolDoesNotExist(schoolPayload);

  return School.create(schoolPayload);
}

async function updateSchool(id, payload) {
  ensureValidObjectId(id, 'School');

  const schoolPayload = pickAllowedFields(payload, ALLOWED_UPDATE_FIELDS);

  if (Object.keys(schoolPayload).length === 0) {
    throw new ApiError(400, 'At least one editable school field is required');
  }

  await ensureDuplicateSchoolDoesNotExist(schoolPayload, id);

  const school = await withSchoolPopulation(School.findByIdAndUpdate(id, { $set: schoolPayload }, { new: true, runValidators: true }));

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

async function updateSchoolStatus(id, status) {
  ensureValidObjectId(id, 'School');

  if (!SCHOOL_STATUSES.includes(status)) {
    throw new ApiError(400, 'School status is invalid');
  }

  const school = await withSchoolPopulation(School.findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true }));

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  return school;
}

async function getAssignableUser(userId, role, schoolId) {
  ensureValidObjectId(userId, `${role} user`);

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, `${role} user not found`);
  }

  if (user.role !== role) {
    throw new ApiError(400, `Selected user must have ${role} role`);
  }

  if (user.status !== 'active') {
    throw new ApiError(400, `Selected ${role} account is ${user.status}`);
  }

  if (user.school && String(user.school) !== String(schoolId)) {
    throw new ApiError(409, `Selected ${role} is already assigned to another school`);
  }

  return user;
}

async function assignPrincipal(id, principalId) {
  ensureValidObjectId(id, 'School');

  const school = await School.findById(id);

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  await getAssignableUser(principalId, 'principal', school._id);

  await User.findByIdAndUpdate(principalId, { $set: { school: school._id } }, { runValidators: true });

  school.principal = principalId;
  await school.save();

  return withSchoolPopulation(School.findById(school._id));
}

async function assignAdmin(id, adminId) {
  ensureValidObjectId(id, 'School');

  const school = await School.findById(id);

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  await getAssignableUser(adminId, 'admin', school._id);

  await User.findByIdAndUpdate(adminId, { $set: { school: school._id } }, { runValidators: true });

  const existingAdmins = new Set(school.admins.map((admin) => String(admin)));
  existingAdmins.add(String(adminId));
  school.admins = Array.from(existingAdmins);
  await school.save();

  return withSchoolPopulation(School.findById(school._id));
}

async function getSchoolAnalytics(id, user) {
  const school = await getSchoolById(id, user);

  const [usersByRole, usersByStatus, studentStatus, teacherStatus, auditCount] = await Promise.all([
    User.aggregate([{ $match: { school: school._id } }, { $group: { _id: '$role', total: { $sum: 1 } } }]),
    User.aggregate([{ $match: { school: school._id } }, { $group: { _id: '$status', total: { $sum: 1 } } }]),
    Student.aggregate([{ $match: { school: school._id } }, { $group: { _id: '$status', total: { $sum: 1 } } }]),
    Teacher.aggregate([{ $match: { school: school._id } }, { $group: { _id: '$status', total: { $sum: 1 } } }]),
    AuditLog.countDocuments({ school: school._id }),
  ]);

  return {
    school: {
      id: school._id,
      name: school.name,
      code: school.code,
      status: school.status,
      academicYear: school.academicYear,
    },
    counts: {
      users: usersByRole.reduce((result, item) => ({ ...result, [item._id]: item.total }), {}),
      userStatuses: usersByStatus.reduce((result, item) => ({ ...result, [item._id]: item.total }), {}),
      students: studentStatus.reduce((result, item) => ({ ...result, [item._id]: item.total }), {}),
      teachers: teacherStatus.reduce((result, item) => ({ ...result, [item._id]: item.total }), {}),
      auditLogs: auditCount,
    },
  };
}

module.exports = {
  assignAdmin,
  assignPrincipal,
  createSchool,
  deleteSchool,
  getSchoolAnalytics,
  getSchoolById,
  listSchools,
  updateSchool,
  updateSchoolStatus,
};
