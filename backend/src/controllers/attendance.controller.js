const attendanceService = require('../services/attendance.service');
const ApiResponse = require('../utils/ApiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

async function markAttendance(req, res, next) {
  try {
    const attendance = await attendanceService.markAttendance(req.body, req.user);
    await logAuditEvent({ req, actor: req.user?._id, school: attendance.school, action: 'attendance.mark', status: 'success', metadata: { entityType: attendance.entityType } });
    return res.status(201).json(new ApiResponse(201, { attendance }, 'Attendance marked'));
  } catch (error) {
    return next(error);
  }
}

async function listAttendance(req, res, next) {
  try {
    const result = await attendanceService.listAttendance(req.query, req.user);
    return res.status(200).json(new ApiResponse(200, result, 'Attendance fetched'));
  } catch (error) {
    return next(error);
  }
}

async function reports(req, res, next) {
  try {
    const report = await attendanceService.getAttendanceReports(req.query, req.user);
    return res.status(200).json(new ApiResponse(200, { report }, 'Attendance report fetched'));
  } catch (error) {
    return next(error);
  }
}

module.exports = { listAttendance, markAttendance, reports };
