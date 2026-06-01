const schoolService = require('../services/school.service');
const ApiResponse = require('../utils/ApiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

async function listSchools(req, res, next) {
  try {
    const result = await schoolService.listSchools(req.query);
    return res.status(200).json(new ApiResponse(200, result, 'Schools fetched'));
  } catch (error) {
    return next(error);
  }
}

async function getSchool(req, res, next) {
  try {
    const school = await schoolService.getSchoolById(req.params.id);
    return res.status(200).json(new ApiResponse(200, { school }, 'School fetched'));
  } catch (error) {
    return next(error);
  }
}

async function createSchool(req, res, next) {
  try {
    const school = await schoolService.createSchool(req.body);

    await logAuditEvent({
      req,
      actor: req.user?._id,
      school: school._id,
      action: 'schools.create',
      status: 'success',
      metadata: { code: school.code },
    });

    return res.status(201).json(new ApiResponse(201, { school }, 'School created'));
  } catch (error) {
    await logAuditEvent({
      req,
      actor: req.user?._id,
      action: 'schools.create',
      status: 'failure',
      metadata: { code: req.body?.code },
    });
    return next(error);
  }
}

async function updateSchool(req, res, next) {
  try {
    const school = await schoolService.updateSchool(req.params.id, req.body);

    await logAuditEvent({
      req,
      actor: req.user?._id,
      school: school._id,
      action: 'schools.update',
      status: 'success',
      metadata: { code: school.code },
    });

    return res.status(200).json(new ApiResponse(200, { school }, 'School updated'));
  } catch (error) {
    await logAuditEvent({
      req,
      actor: req.user?._id,
      school: req.params.id,
      action: 'schools.update',
      status: 'failure',
    });
    return next(error);
  }
}

async function deleteSchool(req, res, next) {
  try {
    const school = await schoolService.deleteSchool(req.params.id);

    await logAuditEvent({
      req,
      actor: req.user?._id,
      school: school._id,
      action: 'schools.delete',
      status: 'success',
      metadata: { code: school.code },
    });

    return res.status(200).json(new ApiResponse(200, { school }, 'School deleted'));
  } catch (error) {
    await logAuditEvent({
      req,
      actor: req.user?._id,
      school: req.params.id,
      action: 'schools.delete',
      status: 'failure',
    });
    return next(error);
  }
}

module.exports = {
  createSchool,
  deleteSchool,
  getSchool,
  listSchools,
  updateSchool,
};
