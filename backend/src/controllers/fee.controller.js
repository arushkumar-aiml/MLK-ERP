const feeService = require('../services/fee.service');
const ApiResponse = require('../utils/ApiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

async function collectFee(req, res, next) {
  try {
    const fee = await feeService.collectFee(req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: fee.school, action: 'fees.collect', status: 'success', metadata: { receiptNumber: fee.receiptNumber } });
    return res.status(201).json(new ApiResponse(201, { fee }, 'Fee collected'));
  } catch (error) {
    return next(error);
  }
}

async function listFees(req, res, next) {
  try {
    const result = await feeService.listFees(req.query, req.user);
    return res.status(200).json(new ApiResponse(200, result, 'Fees fetched'));
  } catch (error) {
    return next(error);
  }
}

async function pendingFees(req, res, next) {
  try {
    const result = await feeService.listPendingFees(req.query, req.user);
    return res.status(200).json(new ApiResponse(200, result, 'Pending fees fetched'));
  } catch (error) {
    return next(error);
  }
}

async function reports(req, res, next) {
  try {
    const report = await feeService.getFeeReports(req.query, req.user);
    return res.status(200).json(new ApiResponse(200, { report }, 'Fee report fetched'));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  collectFee,
  listFees,
  pendingFees,
  reports,
};
