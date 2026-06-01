const router = require('express').Router();

const studentController = require('../controllers/student.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const {
  validateCreateStudent,
  validatePromoteStudents,
  validateTransferStudent,
  validateUpdateStudent,
} = require('../validators/student.validator');

router.use(requireAuth);

router.post('/', requirePermission('students:write'), validateCreateStudent, studentController.createStudent);
router.get('/', requirePermission('students:read'), studentController.listStudents);
router.post('/promote', requirePermission('students:write'), validatePromoteStudents, studentController.promoteStudents);
router.post('/transfer', requirePermission('students:write'), validateTransferStudent, studentController.transferStudent);
router.get('/:id', requirePermission('students:read'), studentController.getStudent);
router.put('/:id', requirePermission('students:write'), validateUpdateStudent, studentController.updateStudent);
router.delete('/:id', requirePermission('students:write'), studentController.deleteStudent);

module.exports = router;
