const express = require('express');
const resultController = require('../controllers/resultController');
const resultValidators = require('../validators/resultValidators');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const scopeTeacherToBuilding = require('../middleware/scopeTeacherToBuilding');
const scopeStudentToSelf = require('../middleware/scopeStudentToSelf');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get(
  '/by-class',
  authorizeRoles('admin', 'teacher', 'coordinator'),
  scopeTeacherToBuilding,
  resultController.getByClass
);

router.get('/all', authorizeRoles('admin'), resultController.getAll);

router.get('/search', authorizeRoles('admin', 'teacher', 'coordinator'), resultController.search);

router.get(
  '/student/:studentId',
  authorizeRoles('admin', 'student'),
  scopeStudentToSelf,
  resultController.getForStudent
);

router.post('/', authorizeRoles('admin'), resultValidators.create, validate, resultController.create);
router.post('/bulk', authorizeRoles('admin'), resultValidators.bulkCreate, validate, resultController.bulkCreate);
router.put('/:id', authorizeRoles('admin'), resultValidators.update, validate, resultController.update);
router.delete('/:id', authorizeRoles('admin'), resultController.remove);

module.exports = router;
