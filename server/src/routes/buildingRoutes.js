const express = require('express');
const buildingController = require('../controllers/buildingController');
const buildingValidators = require('../validators/buildingValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/', buildingController.list);
router.get('/:id', buildingController.getOne);
router.post('/', buildingValidators.create, validate, buildingController.create);
router.put('/:id', buildingValidators.update, validate, buildingController.update);
router.delete('/:id', buildingController.remove);

module.exports = router;
