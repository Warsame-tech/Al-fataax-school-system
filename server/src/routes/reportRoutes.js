const express = require('express');
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.use(authenticate);

router.get('/students', authorizeRoles('admin', 'gudoomiye'), reportController.studentsReport);
router.get('/all-students', authorizeRoles('admin', 'coordinator'), reportController.allStudentsReport);
router.get('/by-building', authorizeRoles('admin'), reportController.byBuildingReport);
router.get('/my-building', authorizeRoles('coordinator'), reportController.myBuildingReport);

module.exports = router;
