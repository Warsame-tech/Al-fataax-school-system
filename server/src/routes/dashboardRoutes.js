const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.get('/summary', authenticate, authorizeRoles('admin', 'gudoomiye'), dashboardController.summary);

module.exports = router;
