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

// The GUDOOMIYE approval queue: every student still awaiting acceptance
// (registrationStatus = 'pending' is a hard filter, not optional — this
// report's entire purpose is the pending list), further narrowable by
// masjid, gender, and an optional createdAt date range, plus a
// masjid-by-masjid breakdown so an all-masjids view is still easy to scan.
// A student leaves this report the moment acceptStudent() flips their
// status — they're never deleted, just no longer pending.
const newStudentsReport = asyncHandler(async (req, res) => {
  const where = { registrationStatus: 'pending' };
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

// The only mutation GUDOOMIYE can perform anywhere in the system: flips one
// student's registrationStatus to 'accepted'. Never touches name, gender,
// masjid, stage, or any other field, and never deletes the row — this is
// intentionally narrower than the general student-update endpoint (which
// GUDOOMIYE has no access to at all) so the role stays view/report-only
// plus this one specific approval action.
const acceptStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  if (student.registrationStatus !== 'accepted') {
    await student.update({ registrationStatus: 'accepted' });
  }
  return res.json({ success: true, data: student });
});

// System-wide, dynamically-computed snapshot: total/male/female across every
// student regardless of status, a masjid-by-masjid student count, and the
// pending/accepted split that powers the approval queue's headline numbers.
const summaryReport = asyncHandler(async (req, res) => {
  const students = await Student.findAll({
    include: [{ model: Building, attributes: ['id', 'name'] }],
  });

  let pending = 0;
  let accepted = 0;
  const byBuilding = new Map();

  students.forEach((s) => {
    if (s.registrationStatus === 'pending') pending += 1;
    else accepted += 1;

    const bId = s.Building?.id;
    const bName = s.Building?.name || 'Unknown';
    if (bId == null) return;
    if (!byBuilding.has(bId)) byBuilding.set(bId, { buildingId: bId, buildingName: bName, count: 0 });
    byBuilding.get(bId).count += 1;
  });

  const { total, male, female } = tally(students);

  return res.json({
    success: true,
    data: {
      total,
      male,
      female,
      pending,
      accepted,
      byBuilding: Array.from(byBuilding.values()).sort((a, b) => a.buildingName.localeCompare(b.buildingName)),
    },
  });
});

module.exports = { masjidStudentsReport, newStudentsReport, acceptStudent, summaryReport };
