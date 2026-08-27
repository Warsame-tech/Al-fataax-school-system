const { Student, Teacher, Building, Class } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

function groupStudents(students) {
  const byBuilding = new Map();
  const byStage = new Map();

  students.forEach((s) => {
    const bId = s.Building?.id;
    const bName = s.Building?.name || 'Unknown';
    if (bId != null) {
      if (!byBuilding.has(bId)) byBuilding.set(bId, { buildingId: bId, buildingName: bName, count: 0, male: 0, female: 0 });
      const row = byBuilding.get(bId);
      row.count += 1;
      if (s.gender === 'Male') row.male += 1;
      else if (s.gender === 'Female') row.female += 1;
    }

    const stId = s.Class?.id;
    const stName = s.Class?.name_ar || 'Unknown';
    if (stId != null) {
      if (!byStage.has(stId)) byStage.set(stId, { stageId: stId, stageName: stName, count: 0, male: 0, female: 0 });
      const row = byStage.get(stId);
      row.count += 1;
      if (s.gender === 'Male') row.male += 1;
      else if (s.gender === 'Female') row.female += 1;
    }
  });

  return {
    byBuilding: Array.from(byBuilding.values()).sort((a, b) => a.buildingName.localeCompare(b.buildingName)),
    byStage: Array.from(byStage.values()).sort((a, b) => a.stageName.localeCompare(b.stageName)),
  };
}

const studentsReport = asyncHandler(async (req, res) => {
  const students = await Student.findAll({
    include: [
      { model: Building, attributes: ['id', 'name'] },
      { model: Class, attributes: ['id', 'name_ar'] },
    ],
  });
  const { byBuilding, byStage } = groupStudents(students);
  return res.json({
    success: true,
    data: { total: students.length, byBuilding, byStage },
  });
});

const teachersReport = asyncHandler(async (req, res) => {
  const teachers = await Teacher.findAll({
    include: [{ model: Building, attributes: ['id', 'name'] }],
  });
  const byBuilding = new Map();
  teachers.forEach((t) => {
    const bId = t.Building?.id;
    const bName = t.Building?.name || 'Unknown';
    if (bId == null) return;
    if (!byBuilding.has(bId)) byBuilding.set(bId, { buildingId: bId, buildingName: bName, count: 0 });
    byBuilding.get(bId).count += 1;
  });
  return res.json({
    success: true,
    data: {
      total: teachers.length,
      byBuilding: Array.from(byBuilding.values()).sort((a, b) => a.buildingName.localeCompare(b.buildingName)),
    },
  });
});

const byBuildingReport = asyncHandler(async (req, res) => {
  const [buildings, students, teachers] = await Promise.all([
    Building.findAll({ order: [['name', 'ASC']] }),
    Student.findAll({ attributes: ['id', 'buildingId'] }),
    Teacher.findAll({ attributes: ['id', 'buildingId'] }),
  ]);

  const studentCounts = new Map();
  students.forEach((s) => studentCounts.set(s.buildingId, (studentCounts.get(s.buildingId) || 0) + 1));
  const teacherCounts = new Map();
  teachers.forEach((t) => teacherCounts.set(t.buildingId, (teacherCounts.get(t.buildingId) || 0) + 1));

  const data = buildings.map((b) => ({
    buildingId: b.id,
    buildingName: b.name,
    studentCount: studentCounts.get(b.id) || 0,
    teacherCount: teacherCounts.get(b.id) || 0,
  }));

  return res.json({ success: true, data });
});

const myBuildingReport = asyncHandler(async (req, res) => {
  const buildingId = req.user.buildingId;
  if (!buildingId) {
    return res.status(400).json({ success: false, message: 'No masjid is assigned to this account.' });
  }

  const [building, students, teacherCount] = await Promise.all([
    Building.findByPk(buildingId),
    Student.findAll({
      where: { buildingId },
      include: [{ model: Class, attributes: ['id', 'name_ar'] }],
    }),
    Teacher.count({ where: { buildingId } }),
  ]);

  if (!building) {
    return res.status(404).json({ success: false, message: 'Masjid not found' });
  }

  const byStage = new Map();
  students.forEach((s) => {
    const stId = s.Class?.id;
    const stName = s.Class?.name_ar || 'Unknown';
    if (stId == null) return;
    if (!byStage.has(stId)) byStage.set(stId, { stageId: stId, stageName: stName, count: 0, male: 0, female: 0 });
    const row = byStage.get(stId);
    row.count += 1;
    if (s.gender === 'Male') row.male += 1;
    else if (s.gender === 'Female') row.female += 1;
  });

  return res.json({
    success: true,
    data: {
      buildingId: building.id,
      buildingName: building.name,
      studentCount: students.length,
      teacherCount,
      studentsByStage: Array.from(byStage.values()).sort((a, b) => a.stageName.localeCompare(b.stageName)),
    },
  });
});

module.exports = { studentsReport, teachersReport, byBuildingReport, myBuildingReport };
