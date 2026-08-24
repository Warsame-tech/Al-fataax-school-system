const express = require('express');
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.use(authenticate);

router.get('/students', authorizeRoles('admin'), reportController.studentsReport);
router.get('/teachers', authorizeRoles('admin'), reportController.teachersReport);
router.get('/by-building', authorizeRoles('admin'), reportController.byBuildingReport);
router.get('/my-building', authorizeRoles('coordinator'), reportController.myBuildingReport);

module.exports = router;
