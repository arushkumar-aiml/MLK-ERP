const examService = require('../services/exam.service');
const ApiResponse = require('../utils/ApiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

async function createExam(req, res, next) {
  try {
    const exam = await examService.createExam(req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: exam.school, action: 'exams.create', status: 'success', metadata: { examId: exam._id } });
    return res.status(201).json(new ApiResponse(201, { exam }, 'Exam created'));
  } catch (error) {
    return next(error);
  }
}

async function createResult(req, res, next) {
  try {
    const result = await examService.createOrUpdateResult(req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: result.school, action: 'results.upsert', status: 'success', metadata: { resultId: result._id } });
    return res.status(201).json(new ApiResponse(201, { result }, 'Result saved'));
  } catch (error) {
    return next(error);
  }
}

async function getStudentResults(req, res, next) {
  try {
    const result = await examService.getResultsForStudent(req.params.studentId, req.user);
    return res.status(200).json(new ApiResponse(200, result, 'Results fetched'));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createExam,
  createResult,
  getStudentResults,
};
