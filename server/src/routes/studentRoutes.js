const express = require('express');
const studentController = require('../controllers/studentController');
const studentStageController = require('../controllers/studentStageController');
const studentValidators = require('../validators/studentValidators');
const studentStageValidators = require('../validators/studentStageValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// GUDOOMIYE is report-only: it can read the student list/detail (e.g. the
// reused All Madrasa Students report) but never write, and never manage
// stage registrations.
router.get('/', authorizeRoles('admin', 'coordinator', 'gudoomiye'), studentController.list);
router.get('/:id', authorizeRoles('admin', 'coordinator', 'gudoomiye'), studentController.getOne);
router.post('/', authorizeRoles('admin', 'coordinator'), studentValidators.create, validate, studentController.create);
router.put('/:id', authorizeRoles('admin', 'coordinator'), studentValidators.update, validate, studentController.update);
router.put('/:id/rename', authorizeRoles('admin', 'coordinator'), studentValidators.rename, validate, studentController.rename);
router.delete('/:id', authorizeRoles('admin', 'coordinator'), studentController.remove);

router.get('/:id/stages', authorizeRoles('admin', 'coordinator'), studentStageController.list);
router.post('/:id/stages', authorizeRoles('admin', 'coordinator'), studentStageValidators.add, validate, studentStageController.add);
router.delete('/:id/stages/:regId', authorizeRoles('admin', 'coordinator'), studentStageController.remove);

module.exports = router;
