const router = require('express').Router();

const schoolController = require('../controllers/school.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');

router.use(requireAuth);

router.get('/', requirePermission('schools:read'), schoolController.listSchools);
router.post('/', requirePermission('schools:write'), schoolController.createSchool);
router.get('/:id', requirePermission('schools:read'), schoolController.getSchool);
router.put('/:id', requirePermission('schools:write'), schoolController.updateSchool);
router.delete('/:id', requirePermission('schools:write'), schoolController.deleteSchool);

module.exports = router;
