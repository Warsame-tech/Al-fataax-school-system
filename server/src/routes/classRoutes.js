const express = require('express');
const classController = require('../controllers/classController');
const classValidators = require('../validators/classValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('admin', 'teacher', 'student', 'coordinator'), classController.list);
router.get('/:id', authorizeRoles('admin', 'teacher', 'student', 'coordinator'), classController.getOne);
router.post('/', authorizeRoles('admin'), classValidators.create, validate, classController.create);
router.put('/:id', authorizeRoles('admin'), classValidators.update, validate, classController.update);
router.delete('/:id', authorizeRoles('admin'), classController.remove);

module.exports = router;
