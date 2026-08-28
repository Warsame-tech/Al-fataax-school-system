const { Op } = require('sequelize');
const { Student, Building, Class } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

function tally(students) {
  let male = 0;
  let female = 0;
  students.forEach((s) => {
    if (s.gender === 'Male') male += 1;
    else if (s.gender === 'Female') female += 1;
  });
  return { total: students.length, male, female };
}

// Admin picks exactly one masjid and gets its full roster + gender split.
const masjidStudentsReport = asyncHandler(async (req, res) => {
  const buildingId = Number(req.query.buildingId);
  if (!buildingId) {
    return res.status(400).json({ success: false, message: 'buildingId is required' });
  }

  const building = await Building.findByPk(buildingId);
  if (!building) {
    return res.status(404).json({ success: false, message: 'Masjid not found' });
  }

  const where = { buildingId };
  if (req.query.gender) where.gender = req.query.gender;

  const students = await Student.findAll({
    where,
    include: [{ model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] } }],
    order: [['name', 'ASC']],
  });

  const { total, male, female } = tally(students);

  return res.json({
    success: true,
    data: {
      buildingId: building.id,
      buildingName: building.name,
      total,
      male,
      female,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        gender: s.gender,
        stageName: (s.Stages || []).map((st) => st.name_ar).join(', ') || null,
      })),
    },
  });
});

// Cross-masjid monitoring of newly registered students: optional masjid,
// optional gender, optional createdAt date range, plus a masjid-by-masjid
// breakdown so an all-masjids view is still easy to scan.
const newStudentsReport = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.buildingId) where.buildingId = Number(req.query.buildingId);
  if (req.query.gender) where.gender = req.query.gender;
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
    if (req.query.to) where.createdAt[Op.lte] = new Date(`${req.query.to}T23:59:59.999`);
  }

  const students = await Student.findAll({
    where,
    include: [
      { model: Building, attributes: ['id', 'name'] },
      { model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] } },
    ],
    order: [['createdAt', 'DESC']],
  });

  const { total, male, female } = tally(students);

  const byBuilding = new Map();
  students.forEach((s) => {
    const bId = s.Building?.id;
    const bName = s.Building?.name || 'Unknown';
    if (bId == null) return;
    if (!byBuilding.has(bId)) byBuilding.set(bId, { buildingId: bId, buildingName: bName, count: 0, male: 0, female: 0 });
    const row = byBuilding.get(bId);
    row.count += 1;
    if (s.gender === 'Male') row.male += 1;
    else if (s.gender === 'Female') row.female += 1;
  });

  return res.json({
    success: true,
    data: {
      total,
      male,
      female,
      byBuilding: Array.from(byBuilding.values()).sort((a, b) => a.buildingName.localeCompare(b.buildingName)),
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        gender: s.gender,
        buildingName: s.Building?.name || null,
        stageName: (s.Stages || []).map((st) => st.name_ar).join(', ') || null,
        createdAt: s.createdAt,
      })),
    },
  });
});

module.exports = { masjidStudentsReport, newStudentsReport };
