const { Op } = require('sequelize');
const { Student, Building, Class } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ownBuildingId } = require('../utils/scoping');

// A student can now be registered for multiple stages, so byStage tallies
// count a multi-stage student once per stage they're enrolled in (byBuilding
// still counts once per student — a student belongs to exactly one masjid).
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

    (s.Stages || []).forEach((stage) => {
      const stId = stage.id;
      const stName = stage.name_ar || 'Unknown';
      if (!byStage.has(stId)) byStage.set(stId, { stageId: stId, stageName: stName, count: 0, male: 0, female: 0 });
      const row = byStage.get(stId);
      row.count += 1;
      if (s.gender === 'Male') row.male += 1;
      else if (s.gender === 'Female') row.female += 1;
    });
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
      { model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] } },
    ],
  });
  const { byBuilding, byStage } = groupStudents(students);
  return res.json({
    success: true,
    data: { total: students.length, byBuilding, byStage },
  });
});

// Flat student list for report pages. Admin gets a system-wide view,
// optionally narrowed by the buildingId query param; a coordinator
// (GUDOOMIYE KUXIGEEN) is always hard-locked to their own masjid via
// ownBuildingId — any buildingId they send is ignored outright, so this
// can never be used to read another masjid's students, whether from the
// UI (which doesn't even offer a masjid picker for that role) or a
// tampered direct API call. Kept separate from studentController.list
// rather than adding a bypass flag there, so that endpoint's own-masjid
// restriction can never accidentally be weakened by a change here.
const allStudentsReport = asyncHandler(async (req, res) => {
  const { search, buildingId, classId, gender } = req.query;
  const where = {};
  const forcedBuildingId = ownBuildingId(req.user);
  if (forcedBuildingId) {
    where.buildingId = forcedBuildingId;
  } else if (buildingId) {
    where.buildingId = Number(buildingId);
  }
  if (gender) where.gender = gender;
  if (search) {
    const term = String(search).trim();
    where[Op.or] = [
      { id: { [Op.like]: `%${term}%` } },
      { name: { [Op.like]: `%${term}%` } },
    ];
  }

  const stageInclude = classId
    ? [{ model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] }, where: { id: Number(classId) }, required: true }]
    : [{ model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] } }];

  const students = await Student.findAll({
    where,
    include: [{ model: Building, attributes: ['id', 'name'] }, ...stageInclude],
    order: [['name', 'ASC']],
  });

  return res.json({ success: true, data: students });
});

const byBuildingReport = asyncHandler(async (req, res) => {
  const [buildings, students] = await Promise.all([
    Building.findAll({ order: [['name', 'ASC']] }),
    Student.findAll({ attributes: ['id', 'buildingId'] }),
  ]);

  const studentCounts = new Map();
  students.forEach((s) => studentCounts.set(s.buildingId, (studentCounts.get(s.buildingId) || 0) + 1));

  const data = buildings.map((b) => ({
    buildingId: b.id,
    buildingName: b.name,
    studentCount: studentCounts.get(b.id) || 0,
  }));

  return res.json({ success: true, data });
});

const myBuildingReport = asyncHandler(async (req, res) => {
  const buildingId = req.user.buildingId;
  if (!buildingId) {
    return res.status(400).json({ success: false, message: 'No masjid is assigned to this account.' });
  }

  const [building, students] = await Promise.all([
    Building.findByPk(buildingId),
    Student.findAll({
      where: { buildingId },
      include: [{ model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] } }],
    }),
  ]);

  if (!building) {
    return res.status(404).json({ success: false, message: 'Masjid not found' });
  }

  // A multi-stage student is tallied once per stage they're enrolled in.
  const byStage = new Map();
  students.forEach((s) => {
    (s.Stages || []).forEach((stage) => {
      const stId = stage.id;
      const stName = stage.name_ar || 'Unknown';
      if (!byStage.has(stId)) byStage.set(stId, { stageId: stId, stageName: stName, count: 0, male: 0, female: 0 });
      const row = byStage.get(stId);
      row.count += 1;
      if (s.gender === 'Male') row.male += 1;
      else if (s.gender === 'Female') row.female += 1;
    });
  });

  return res.json({
    success: true,
    data: {
      buildingId: building.id,
      buildingName: building.name,
      studentCount: students.length,
      studentsByStage: Array.from(byStage.values()).sort((a, b) => a.stageName.localeCompare(b.stageName)),
    },
  });
});

module.exports = { studentsReport, allStudentsReport, byBuildingReport, myBuildingReport };
