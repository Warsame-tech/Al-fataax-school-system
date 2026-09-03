const express = require('express');
const authController = require('../controllers/authController');
const passwordResetController = require('../controllers/passwordResetController');
const authenticate = require('../middleware/authenticate');
const { loginLimiter, heartbeatLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/heartbeat', authenticate, heartbeatLimiter, authController.heartbeat);

// Forgot Password — deliberately unauthenticated (see rateLimiter.js for
// the abuse-budget reasoning). /admin-email exists only to pre-fill the
// email field per an explicit admin request, at the cost of exposing that
// address to anyone who visits the page — see getAdminEmail's comment.
router.get('/admin-email', passwordResetLimiter, passwordResetController.getAdminEmail);
router.post('/forgot-password', passwordResetLimiter, passwordResetController.forgotPassword);
router.post('/verify-reset-otp', passwordResetLimiter, passwordResetController.verifyResetOtp);
router.post('/reset-password', passwordResetLimiter, passwordResetController.resetPassword);

module.exports = router;
