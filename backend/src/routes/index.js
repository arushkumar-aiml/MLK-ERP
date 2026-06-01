const router = require('express').Router();

const authRoutes = require('./auth.routes');
const healthRoutes = require('./health.routes');
const schoolRoutes = require('./school.routes');

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/schools', schoolRoutes);

module.exports = router;
