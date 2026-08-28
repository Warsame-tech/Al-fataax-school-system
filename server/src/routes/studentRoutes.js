const express = require('express');
const studentController = require('../controllers/studentController');
const studentStageController = require('../controllers/studentStageController');
const studentValidators = require('../validators/studentValidators');
const studentStageValidators = require('../validators/studentStageValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorizeRoles('admin', 'coordinator'));

router.get('/', studentController.list);
router.get('/:id', studentController.getOne);
router.post('/', studentValidators.create, validate, studentController.create);
router.put('/:id', studentValidators.update, validate, studentController.update);
router.put('/:id/rename', studentValidators.rename, validate, studentController.rename);
router.delete('/:id', studentController.remove);

router.get('/:id/stages', studentStageController.list);
router.post('/:id/stages', studentStageValidators.add, validate, studentStageController.add);
router.delete('/:id/stages/:regId', studentStageController.remove);

module.exports = router;
