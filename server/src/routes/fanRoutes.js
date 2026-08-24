const express = require('express');
const fanController = require('../controllers/fanController');
const fanValidators = require('../validators/fanValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('admin'));

router.get('/', fanController.list);
router.get('/:id', fanController.getOne);
router.post('/', fanValidators.create, validate, fanController.create);
router.put('/:id', fanValidators.update, validate, fanController.update);
router.delete('/:id', fanController.remove);

module.exports = router;
