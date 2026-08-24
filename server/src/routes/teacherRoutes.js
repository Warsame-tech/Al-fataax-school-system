const express = require('express');
const teacherController = require('../controllers/teacherController');
const teacherValidators = require('../validators/teacherValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/', teacherController.list);
router.get('/:id', teacherController.getOne);
router.post('/', teacherValidators.create, validate, teacherController.create);
router.put('/:id', teacherValidators.update, validate, teacherController.update);
router.delete('/:id', teacherController.remove);

module.exports = router;
