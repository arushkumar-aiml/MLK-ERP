const router = require('express').Router();

const examController = require('../controllers/exam.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateCreateExam } = require('../validators/exam.validator');

router.use(requireAuth);
router.post('/', requirePermission('exams:write'), validateCreateExam, examController.createExam);

module.exports = router;
