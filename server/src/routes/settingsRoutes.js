const express = require('express');
const settingsController = require('../controllers/settingsController');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.use(authenticate);

// Admin-only: this is the one control surface for the global Results
// Visibility switch (see systemSettings.js / enforceResultsVisibility.js).
router.get('/results-visibility', authorizeRoles('admin'), settingsController.getResultsVisibility);
router.put('/results-visibility', authorizeRoles('admin'), settingsController.updateResultsVisibility);

module.exports = router;
