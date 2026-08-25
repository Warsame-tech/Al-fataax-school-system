const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { loginLimiter, heartbeatLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/heartbeat', authenticate, heartbeatLimiter, authController.heartbeat);

module.exports = router;
