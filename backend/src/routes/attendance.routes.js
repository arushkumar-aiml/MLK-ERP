const router = require('express').Router();

const attendanceController = require('../controllers/attendance.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateAttendance } = require('../validators/attendance.validator');

router.use(requireAuth);

router.post('/', requirePermission('attendance:write'), validateAttendance, attendanceController.markAttendance);
router.get('/', requirePermission('attendance:read'), attendanceController.listAttendance);
router.get('/reports', requirePermission('attendance:read'), attendanceController.reports);

module.exports = router;
