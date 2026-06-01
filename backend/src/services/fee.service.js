const { Fee, School, Student } = require('../models');
const ApiError = require('../utils/ApiError');
const { buildSchoolScope, resolveSchoolForWrite } = require('./scope.service');
const { getNextSequence, padSequence } = require('./sequence.service');

async function generateReceiptNumber(schoolId) {
  const school = await School.findById(schoolId).select('code');
  if (!school) throw new ApiError(404, 'School not found');
  const year = String(new Date().getFullYear());
  const prefix = `MLK-${school.code}-${year}`;
  const sequence = await getNextSequence(Fee, { school: schoolId, receiptNumber: { $regex: `^${prefix}-` } }, 'receiptNumber');
  return `${prefix}-${padSequence(sequence, 4)}`;
}

function calculateStatus(totalAmount, paidAmount) {
  if (paidAmount <= 0) return 'pending';
  if (paidAmount >= totalAmount) return 'paid';
  return 'partial';
}

async function collectFee(payload, user) {
  const school = resolveSchoolForWrite(user, payload.school);
  const student = await Student.findOne({ _id: payload.student, school });
  if (!student) throw new ApiError(404, 'Student not found in selected school');

  const totalAmount = payload.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const paidAmount = Math.min(payload.paidAmount ?? totalAmount, totalAmount);
  const balanceAmount = totalAmount - paidAmount;
  const status = calculateStatus(totalAmount, paidAmount);
  const receiptNumber = await generateReceiptNumber(school);

  return Fee.create({
    school,
    student: student._id,
    receiptNumber,
    academicYear: payload.academicYear,
    dueDate: payload.dueDate,
    lineItems: payload.lineItems,
    totalAmount,
    paidAmount,
    balanceAmount,
    status,
    payments:
      paidAmount > 0
        ? [{ amount: paidAmount, method: payload.method || 'cash', referenceNumber: payload.referenceNumber, collectedBy: user._id }]
        : [],
  });
}

async function listFees(filters, user) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const query = buildSchoolScope(user, filters.school);
  if (filters.status) query.status = filters.status;
  if (filters.student) query.student = filters.student;
  if (filters.academicYear) query.academicYear = filters.academicYear;

  const [fees, total] = await Promise.all([
    Fee.find(query).populate('school', 'name code').populate('student', 'admissionNumber firstName lastName className section').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Fee.countDocuments(query),
  ]);
  return { fees, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

async function listPendingFees(filters, user) {
  return listFees({ ...filters, status: filters.status || 'pending' }, user);
}

async function getFeeReports(filters, user) {
  const match = buildSchoolScope(user, filters.school);
  if (filters.academicYear) match.academicYear = filters.academicYear;

  const rows = await Fee.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: { $sum: '$paidAmount' },
        balanceAmount: { $sum: '$balanceAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return rows.reduce(
    (report, row) => ({
      ...report,
      [row._id]: {
        count: row.count,
        totalAmount: row.totalAmount,
        paidAmount: row.paidAmount,
        balanceAmount: row.balanceAmount,
      },
    }),
    {}
  );
}

module.exports = {
  collectFee,
  getFeeReports,
  listFees,
  listPendingFees,
};
