const rateLimit = require('express-rate-limit');
const router = require('express').Router();

const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

router.post('/login', authLimiter, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.get('/profile', requireAuth, authController.profile);
router.put('/change-password', requireAuth, authController.changePassword);

module.exports = router;
