const router = require('express').Router();

const schoolController = require('../controllers/school.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission, requireRoles } = require('../middleware/role.middleware');
const {
  validateAdminAssignment,
  validateCreateSchool,
  validatePrincipalAssignment,
  validateSchoolStatus,
  validateUpdateSchool,
} = require('../validators/school.validator');

router.use(requireAuth);

router.get('/', requirePermission('schools:read'), schoolController.listSchools);
router.post('/', requirePermission('schools:write'), requireRoles('superadmin'), validateCreateSchool, schoolController.createSchool);
router.get('/:id', requirePermission('schools:read'), schoolController.getSchool);
router.put('/:id', requirePermission('schools:write'), requireRoles('superadmin'), validateUpdateSchool, schoolController.updateSchool);
router.delete('/:id', requirePermission('schools:write'), requireRoles('superadmin'), schoolController.deleteSchool);
router.patch('/:id/status', requirePermission('schools:write'), requireRoles('superadmin'), validateSchoolStatus, schoolController.updateSchoolStatus);
router.post(
  '/:id/assign-principal',
  requirePermission('schools:write'),
  requireRoles('superadmin'),
  validatePrincipalAssignment,
  schoolController.assignPrincipal
);
router.post(
  '/:id/assign-admin',
  requirePermission('schools:write'),
  requireRoles('superadmin'),
  validateAdminAssignment,
  schoolController.assignAdmin
);
router.get('/:id/analytics', requirePermission('schools:read'), schoolController.getSchoolAnalytics);

module.exports = router;
