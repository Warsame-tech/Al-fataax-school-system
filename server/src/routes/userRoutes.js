const express = require('express');
const userController = require('../controllers/userController');
const userValidators = require('../validators/userValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const { accountWriteLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/', userController.list);
router.get('/:id', userController.getOne);
router.post('/', accountWriteLimiter, userValidators.create, validate, userController.create);
router.put('/:id', accountWriteLimiter, userValidators.update, validate, userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
