const studentService = require('../services/student.service');
const ApiResponse = require('../utils/ApiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

async function listStudents(req, res, next) {
  try {
    const result = await studentService.listStudents(req.query, req.user);
    return res.status(200).json(new ApiResponse(200, result, 'Students fetched'));
  } catch (error) {
    return next(error);
  }
}

async function getStudent(req, res, next) {
  try {
    const student = await studentService.getStudentById(req.params.id, req.user);
    return res.status(200).json(new ApiResponse(200, { student }, 'Student fetched'));
  } catch (error) {
    return next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    const student = await studentService.createStudent(req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: student.school, action: 'students.create', status: 'success', metadata: { admissionNumber: student.admissionNumber } });
    return res.status(201).json(new ApiResponse(201, { student }, 'Student registered'));
  } catch (error) {
    await logAuditEvent({ req, actor: req.user?._id, school: req.body?.school || req.user?.school, action: 'students.create', status: 'failure' });
    return next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: student.school, action: 'students.update', status: 'success', metadata: { studentId: student._id } });
    return res.status(200).json(new ApiResponse(200, { student }, 'Student updated'));
  } catch (error) {
    await logAuditEvent({ req, actor: req.user?._id, school: req.user?.school, action: 'students.update', status: 'failure', metadata: { studentId: req.params.id } });
    return next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const student = await studentService.deleteStudent(req.params.id, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: student.school, action: 'students.archive', status: 'success', metadata: { studentId: student._id } });
    return res.status(200).json(new ApiResponse(200, { student }, 'Student archived'));
  } catch (error) {
    return next(error);
  }
}

async function promoteStudents(req, res, next) {
  try {
    const result = await studentService.promoteStudents(req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: req.body?.school || req.user?.school, action: 'students.promote', status: 'success', metadata: result });
    return res.status(200).json(new ApiResponse(200, result, 'Students promoted'));
  } catch (error) {
    return next(error);
  }
}

async function transferStudent(req, res, next) {
  try {
    const student = await studentService.transferStudent(req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: student.school, action: 'students.transfer', status: 'success', metadata: { studentId: student._id } });
    return res.status(200).json(new ApiResponse(200, { student }, 'Student transferred'));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  promoteStudents,
  transferStudent,
  updateStudent,
};
