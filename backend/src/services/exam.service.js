const { Exam, Result, Student } = require('../models');
const ApiError = require('../utils/ApiError');
const { buildSchoolScope, resolveSchoolForWrite } = require('./scope.service');

async function createExam(payload, user) {
  const school = resolveSchoolForWrite(user, payload.school);
  return Exam.create({ ...payload, school });
}

async function createOrUpdateResult(payload, user) {
  const school = resolveSchoolForWrite(user, payload.school);
  const [exam, student] = await Promise.all([Exam.findOne({ _id: payload.exam, school }), Student.findOne({ _id: payload.student, school })]);
  if (!exam) throw new ApiError(404, 'Exam not found');
  if (!student) throw new ApiError(404, 'Student not found');

  const totalMarks = payload.marks.reduce((sum, mark) => sum + mark.marksObtained, 0);
  const maxMarks = payload.marks.reduce((sum, mark) => sum + mark.maxMarks, 0);
  const percentage = Number(((totalMarks / maxMarks) * 100).toFixed(2));

  const result = await Result.findOneAndUpdate(
    { school, exam: exam._id, student: student._id },
    { $set: { ...payload, school, totalMarks, maxMarks, percentage } },
    { new: true, upsert: true, runValidators: true }
  );

  await recalculateRanks(school, exam._id);
  return Result.findById(result._id).populate('student', 'admissionNumber firstName lastName className section').populate('exam', 'name academicYear');
}

async function recalculateRanks(school, exam) {
  const results = await Result.find({ school, exam }).sort({ percentage: -1, totalMarks: -1 });
  await Promise.all(results.map((result, index) => Result.updateOne({ _id: result._id }, { $set: { rank: index + 1 } })));
}

async function getResultsForStudent(studentId, user) {
  const query = { student: studentId, ...buildSchoolScope(user) };
  const results = await Result.find(query).populate('exam', 'name academicYear status').sort({ createdAt: -1 });
  return { results };
}

module.exports = {
  createExam,
  createOrUpdateResult,
  getResultsForStudent,
};
