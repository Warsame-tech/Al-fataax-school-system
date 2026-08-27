const { sequelize, Result, Student, Subject, Building, Class } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { buildResultRow } = require('../utils/gradeCalculator');
const { ownBuildingId } = require('../utils/scoping');

// Fetches a student's Results joined with Subject and maps them into the
// { subjectId, subjectName, marks } shape buildResultRow expects.
async function getResultRowsForStudent(studentId) {
  const results = await Result.findAll({
    where: { studentId },
    include: [{ model: Subject, attributes: ['id', 'name_ar'] }],
    order: [[Subject, 'name_ar', 'ASC']],
  });

  return results.map((r) => ({
    id: r.id,
    subjectId: r.Subject.id,
    subjectName: r.Subject.name_ar,
    marks: r.marks,
  }));
}

async function buildStudentMarksheet(student) {
  const resultRows = await getResultRowsForStudent(student.id);
  const row = buildResultRow(resultRows);
  return {
    studentId: student.id,
    studentName: student.name,
    buildingId: student.buildingId,
    buildingName: student.Building?.name,
    classId: student.classId,
    stageName: student.Class?.name_ar,
    ...row,
  };
}

const create = asyncHandler(async (req, res) => {
  const studentId = Number(req.body.studentId);
  const subjectId = Number(req.body.subjectId);
  const { marks } = req.body;

  const student = await Student.findByPk(studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const subject = await Subject.findByPk(subjectId);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  let result = await Result.findOne({ where: { studentId, subjectId } });
  if (result) {
    await result.update({ marks });
  } else {
    result = await Result.create({ studentId, subjectId, marks });
  }

  return res.status(201).json({ success: true, data: result });
});

// Saves an entire student's result sheet (every subject/book of their stage)
// in one submission, inside a transaction so it's all-or-nothing.
const bulkCreate = asyncHandler(async (req, res) => {
  const studentId = Number(req.body.studentId);
  const marksArr = Array.isArray(req.body.marks) ? req.body.marks : [];

  const student = await Student.findByPk(studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const entries = marksArr
    .map((m) => ({ subjectId: Number(m.subjectId), marks: m.marks }))
    .filter((m) => !Number.isNaN(m.subjectId) && m.marks !== '' && m.marks != null);

  if (!entries.length) {
    return res.status(400).json({ success: false, message: 'At least one mark is required.' });
  }

  for (const e of entries) {
    const numMarks = Number(e.marks);
    if (Number.isNaN(numMarks) || numMarks < 0 || numMarks > 100) {
      return res.status(400).json({ success: false, message: `Invalid marks value for subjectId ${e.subjectId}. Must be 0-100.` });
    }
  }

  const subjectIds = entries.map((e) => e.subjectId);
  const subjects = await Subject.findAll({ where: { id: subjectIds } });
  if (subjects.length !== subjectIds.length) {
    return res.status(404).json({ success: false, message: 'One or more religious books were not found.' });
  }

  await sequelize.transaction(async (t) => {
    for (const e of entries) {
      const existing = await Result.findOne({ where: { studentId, subjectId: e.subjectId }, transaction: t });
      if (existing) {
        await existing.update({ marks: e.marks }, { transaction: t });
      } else {
        await Result.create({ studentId, subjectId: e.subjectId, marks: e.marks }, { transaction: t });
      }
    }
  });

  const studentWithRelations = await Student.findByPk(studentId, {
    include: [
      { model: Building, attributes: ['id', 'name'] },
      { model: Class, attributes: ['id', 'name_ar'] },
    ],
  });
  const marksheet = await buildStudentMarksheet(studentWithRelations);
  return res.status(201).json({ success: true, data: marksheet });
});

const update = asyncHandler(async (req, res) => {
  const result = await Result.findByPk(req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await result.update({ marks: req.body.marks });
  return res.json({ success: true, data: result });
});

const remove = asyncHandler(async (req, res) => {
  const result = await Result.findByPk(req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  await result.destroy();
  return res.json({ success: true, message: 'Deleted' });
});

const getByClass = asyncHandler(async (req, res) => {
  const buildingId = Number(req.effectiveBuildingId);
  const classId = Number(req.query.classId);

  if (!buildingId || !classId) {
    return res.status(400).json({ success: false, message: 'buildingId and classId are required' });
  }

  const students = await Student.findAll({
    where: { buildingId, classId },
    order: [['name', 'ASC']],
  });

  const subjectMap = new Map();

  const data = await Promise.all(
    students.map(async (student) => {
      const resultRows = await getResultRowsForStudent(student.id);
      resultRows.forEach((row) => {
        if (!subjectMap.has(row.subjectId)) {
          subjectMap.set(row.subjectId, row.subjectName);
        }
      });
      const row = buildResultRow(resultRows);
      return {
        studentId: student.id,
        studentName: student.name,
        ...row,
      };
    })
  );

  const subjectColumns = Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));

  return res.json({ success: true, data, subjectColumns });
});

// Admin-only: every student's results across every masjid/stage, optionally
// narrowed by buildingId/classId. Subject columns are the union of every
// book that has at least one result among the returned students.
const getAll = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.buildingId) where.buildingId = Number(req.query.buildingId);
  if (req.query.classId) where.classId = Number(req.query.classId);

  const students = await Student.findAll({
    where,
    include: [
      { model: Building, attributes: ['id', 'name'] },
      { model: Class, attributes: ['id', 'name_ar'] },
    ],
    order: [['name', 'ASC']],
  });

  const subjectMap = new Map();
  const data = await Promise.all(
    students.map(async (student) => {
      const resultRows = await getResultRowsForStudent(student.id);
      resultRows.forEach((row) => {
        if (!subjectMap.has(row.subjectId)) {
          subjectMap.set(row.subjectId, row.subjectName);
        }
      });
      const row = buildResultRow(resultRows);
      return {
        studentId: student.id,
        studentName: student.name,
        buildingName: student.Building?.name,
        stageName: student.Class?.name_ar,
        ...row,
      };
    })
  );

  const subjectColumns = Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
  return res.json({ success: true, data, subjectColumns });
});

const getForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.studentId, {
    include: [
      { model: Building, attributes: ['id', 'name', 'resultsVisible'] },
      { model: Class, attributes: ['id', 'name_ar'] },
    ],
  });
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  // Only the student's own self-view is gated by their masjid's toggle —
  // admin/teacher/coordinator reach this same endpoint too (e.g. from the
  // Results Registration and Student Report pages) and must keep working
  // regardless of the toggle.
  if (req.user.userType === 'student' && student.Building?.resultsVisible === false) {
    return res.status(403).json({
      success: false,
      message: 'Results are not currently available for your masjid. Please contact your masjid administrator.',
    });
  }

  const marksheet = await buildStudentMarksheet(student);
  return res.json({ success: true, data: marksheet });
});

// Student-ID lookup used by the "Search by Student ID" tool. Admin can look
// up anyone; teacher/coordinator are restricted to their own masjid — this
// is the server-side enforcement, the frontend never decides access.
const search = asyncHandler(async (req, res) => {
  const studentId = Number(req.query.studentId);
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'studentId is required' });
  }

  const student = await Student.findByPk(studentId, {
    include: [
      { model: Building, attributes: ['id', 'name'] },
      { model: Class, attributes: ['id', 'name_ar'] },
    ],
  });

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found. Please check the Student ID and try again.' });
  }

  const own = ownBuildingId(req.user);
  if (own != null && student.buildingId !== own) {
    return res.status(403).json({ success: false, message: "You are not authorized to view this student's results." });
  }

  const marksheet = await buildStudentMarksheet(student);
  return res.json({ success: true, data: marksheet });
});

module.exports = { create, bulkCreate, update, remove, getByClass, getAll, getForStudent, search };
