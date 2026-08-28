const { Student, Class, StudentStage } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { coordinatorBuildingId } = require('./studentController');

async function loadScopedStudent(req) {
  const student = await Student.findByPk(req.params.id);
  if (!student) return { error: { status: 404, message: 'Student not found' } };
  const forcedBuildingId = coordinatorBuildingId(req);
  if (forcedBuildingId && student.buildingId !== forcedBuildingId) {
    return { error: { status: 403, message: 'Forbidden' } };
  }
  return { student };
}

const list = asyncHandler(async (req, res) => {
  const { student, error } = await loadScopedStudent(req);
  if (error) return res.status(error.status).json({ success: false, message: error.message });

  const registrations = await StudentStage.findAll({
    where: { studentId: student.id },
    include: [{ model: Class, attributes: ['id', 'name_ar'] }],
    order: [['id', 'ASC']],
  });
  return res.json({
    success: true,
    data: registrations.map((r) => ({ id: r.id, classId: r.classId, stageName: r.Class?.name_ar || null })),
  });
});

const add = asyncHandler(async (req, res) => {
  const { student, error } = await loadScopedStudent(req);
  if (error) return res.status(error.status).json({ success: false, message: error.message });

  const classId = Number(req.body.classId);
  const stage = await Class.findByPk(classId);
  if (!stage) {
    return res.status(404).json({ success: false, message: 'Educational stage not found' });
  }

  const existing = await StudentStage.findOne({ where: { studentId: student.id, classId } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'This student is already registered for that stage.' });
  }

  const registration = await StudentStage.create({ studentId: student.id, classId });
  return res.status(201).json({
    success: true,
    data: { id: registration.id, classId: registration.classId, stageName: stage.name_ar },
  });
});

const remove = asyncHandler(async (req, res) => {
  const { student, error } = await loadScopedStudent(req);
  if (error) return res.status(error.status).json({ success: false, message: error.message });

  const registration = await StudentStage.findOne({ where: { id: req.params.regId, studentId: student.id } });
  if (!registration) {
    return res.status(404).json({ success: false, message: 'Stage registration not found' });
  }
  await registration.destroy();
  return res.json({ success: true, message: 'Removed' });
});

module.exports = { list, add, remove };
