const express = require('express');
const gudoomiyeReportController = require('../controllers/gudoomiyeReportController');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin', 'gudoomiye'));

router.get('/masjid-students', gudoomiyeReportController.masjidStudentsReport);
router.get('/new-students', gudoomiyeReportController.newStudentsReport);

module.exports = router;
