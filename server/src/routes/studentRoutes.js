const express = require('express');
const studentController = require('../controllers/studentController');
const studentValidators = require('../validators/studentValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin', 'coordinator'));

router.get('/', studentController.list);
router.get('/:id', studentController.getOne);
router.post('/', studentValidators.create, validate, studentController.create);
router.put('/:id', studentValidators.update, validate, studentController.update);
router.delete('/:id', studentController.remove);

module.exports = router;
