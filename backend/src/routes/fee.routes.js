const router = require('express').Router();

const feeController = require('../controllers/fee.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');
const { validateCollectFee } = require('../validators/fee.validator');

router.use(requireAuth);

router.post('/collect', requirePermission('fees:write'), validateCollectFee, feeController.collectFee);
router.get('/', requirePermission('fees:read'), feeController.listFees);
router.get('/pending', requirePermission('fees:read'), feeController.pendingFees);
router.get('/reports', requirePermission('fees:read'), feeController.reports);

module.exports = router;
