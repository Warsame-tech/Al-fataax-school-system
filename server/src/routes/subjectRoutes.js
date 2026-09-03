const express = require('express');
const subjectController = require('../controllers/subjectController');
const subjectValidators = require('../validators/subjectValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('admin', 'student', 'coordinator'), subjectController.list);
router.get('/:id', authorizeRoles('admin', 'student', 'coordinator'), subjectController.getOne);
router.post('/', authorizeRoles('admin'), subjectValidators.create, validate, subjectController.create);
router.put('/:id', authorizeRoles('admin'), subjectValidators.update, validate, subjectController.update);
router.delete('/:id', authorizeRoles('admin'), subjectController.remove);

module.exports = router;
