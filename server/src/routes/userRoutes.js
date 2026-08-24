const express = require('express');
const userController = require('../controllers/userController');
const userValidators = require('../validators/userValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/', userController.list);
router.get('/:id', userController.getOne);
router.post('/', userValidators.create, validate, userController.create);
router.put('/:id', userValidators.update, validate, userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
