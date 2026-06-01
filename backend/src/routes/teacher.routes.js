const router = require('express').Router();

const teacherController = require('../controllers/teacher.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateCreateTeacher, validateUpdateTeacher } = require('../validators/teacher.validator');

router.use(requireAuth);

router.post('/', requirePermission('teachers:write'), validateCreateTeacher, teacherController.createTeacher);
router.get('/', requirePermission('teachers:read'), teacherController.listTeachers);
router.get('/:id', requirePermission('teachers:read'), teacherController.getTeacher);
router.put('/:id', requirePermission('teachers:write'), validateUpdateTeacher, teacherController.updateTeacher);
router.delete('/:id', requirePermission('teachers:write'), teacherController.deleteTeacher);

module.exports = router;
