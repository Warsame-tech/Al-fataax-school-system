const express = require('express');
const coordinatorController = require('../controllers/coordinatorController');
const coordinatorValidators = require('../validators/coordinatorValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/', coordinatorController.list);
router.get('/:id', coordinatorController.getOne);
router.post('/', coordinatorValidators.create, validate, coordinatorController.create);
router.put('/:id', coordinatorValidators.update, validate, coordinatorController.update);
router.delete('/:id', coordinatorController.remove);

module.exports = router;
