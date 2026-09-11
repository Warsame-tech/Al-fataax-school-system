const express = require('express');
const resultController = require('../controllers/resultController');
const resultValidators = require('../validators/resultValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const scopeToOwnBuilding = require('../middleware/scopeToOwnBuilding');
const scopeStudentToSelf = require('../middleware/scopeStudentToSelf');
const enforceResultsVisibility = require('../middleware/enforceResultsVisibility');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
// Single global gate for every route below: blocks every non-admin role
// outright while Results Visibility is OFF (see systemSettings.js). Write
// routes below are admin-only anyway, so this only ever actually blocks
// the read routes for non-admin roles.
router.use(enforceResultsVisibility);

router.get(
  '/by-class',
  authorizeRoles('admin', 'coordinator', 'gudoomiye'),
  scopeToOwnBuilding,
  resultController.getByClass
);

router.get('/all', authorizeRoles('admin', 'coordinator', 'gudoomiye'), resultController.getAll);

router.get('/leaderboard', authorizeRoles('admin', 'coordinator'), resultController.getLeaderboard);

router.get('/search', authorizeRoles('admin', 'coordinator', 'gudoomiye'), resultController.search);

router.get(
  '/student/:studentId',
  authorizeRoles('admin', 'student'),
  scopeStudentToSelf,
  resultController.getForStudent
);

router.post('/', authorizeRoles('admin'), resultValidators.create, validate, resultController.create);
router.post('/bulk', authorizeRoles('admin'), resultValidators.bulkCreate, validate, resultController.bulkCreate);
router.put('/:id', authorizeRoles('admin'), resultValidators.update, validate, resultController.update);
router.delete('/:id', authorizeRoles('admin'), resultController.remove);

module.exports = router;
