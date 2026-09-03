const express = require('express');
const buildingController = require('../controllers/buildingController');
const buildingValidators = require('../validators/buildingValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// GUDOOMIYE's reports (masjid dropdowns, and the reused All Madrasa
// Students report) need to read the masjid list; only admin can write.
// Coordinators are deliberately excluded from the list route (they must
// never see other masjids' names), but are allowed the single-record read
// — buildingController.getOne enforces they can only ever fetch their own.
router.get('/', authorizeRoles('admin', 'gudoomiye'), buildingController.list);
router.get('/:id', authorizeRoles('admin', 'gudoomiye', 'coordinator'), buildingController.getOne);
router.post('/', authorizeRoles('admin'), buildingValidators.create, validate, buildingController.create);
router.put('/:id', authorizeRoles('admin'), buildingValidators.update, validate, buildingController.update);
router.delete('/:id', authorizeRoles('admin'), buildingController.remove);

module.exports = router;
