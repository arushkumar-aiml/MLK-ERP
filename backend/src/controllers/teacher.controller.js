const teacherService = require('../services/teacher.service');
const ApiResponse = require('../utils/ApiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

async function listTeachers(req, res, next) {
  try {
    const result = await teacherService.listTeachers(req.query, req.user);
    return res.status(200).json(new ApiResponse(200, result, 'Teachers fetched'));
  } catch (error) {
    return next(error);
  }
}

async function getTeacher(req, res, next) {
  try {
    const teacher = await teacherService.getTeacherById(req.params.id, req.user);
    return res.status(200).json(new ApiResponse(200, { teacher }, 'Teacher fetched'));
  } catch (error) {
    return next(error);
  }
}

async function createTeacher(req, res, next) {
  try {
    const teacher = await teacherService.createTeacher(req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: teacher.school, action: 'teachers.create', status: 'success', metadata: { employeeId: teacher.employeeId } });
    return res.status(201).json(new ApiResponse(201, { teacher }, 'Teacher created'));
  } catch (error) {
    return next(error);
  }
}

async function updateTeacher(req, res, next) {
  try {
    const teacher = await teacherService.updateTeacher(req.params.id, req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: teacher.school, action: 'teachers.update', status: 'success', metadata: { teacherId: teacher._id } });
    return res.status(200).json(new ApiResponse(200, { teacher }, 'Teacher updated'));
  } catch (error) {
    return next(error);
  }
}

async function deleteTeacher(req, res, next) {
  try {
    const teacher = await teacherService.deleteTeacher(req.params.id, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: teacher.school, action: 'teachers.delete', status: 'success', metadata: { teacherId: teacher._id } });
    return res.status(200).json(new ApiResponse(200, { teacher }, 'Teacher archived'));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createTeacher,
  deleteTeacher,
  getTeacher,
  listTeachers,
  updateTeacher,
};
