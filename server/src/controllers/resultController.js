const { QueryTypes, Op } = require('sequelize');
const { sequelize, Result, Student, Subject, Building, Class } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { buildResultRow } = require('../utils/gradeCalculator');
const { ownBuildingId } = require('../utils/scoping');

const studentStagesInclude = { model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] } };

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

// A religious book belongs to exactly one educational stage (the existing
// app-enforced exclusivity rule in classController.js/subjectController.js
// — a book can never be assigned to two stages at once), so "which stage is
// this result for" is reliably derivable from the book alone. This is the
// single source of truth for stage membership; Result itself carries no
// stageId column, avoiding a second copy of that fact that could drift.
async function getStageBookIds(classId) {
  const rows = await sequelize.query(
    'SELECT book_id FROM stage_religious_books WHERE stage_id = :classId',
    { replacements: { classId }, type: QueryTypes.SELECT },
  );
  return new Set(rows.map((r) => r.book_id));
}

// Builds a student's results grouped into one section per stage they're
// currently registered for — stages are never combined into a single
// total. Any result whose book isn't part of any of the student's current
// stages (e.g. the book was reassigned since the mark was entered) is
// still surfaced, in a small otherResults catch-all, so nothing silently
// disappears from the accounting.
async function buildStudentStageSheet(student) {
  const [resultRows, stages] = await Promise.all([
    getResultRowsForStudent(student.id),
    student.Stages || [],
  ]);

  const bookSets = await Promise.all(stages.map((stage) => getStageBookIds(stage.id)));
  const claimedSubjectIds = new Set();

  const stageSections = stages.map((stage, i) => {
    const bookIds = bookSets[i];
    const rowsForStage = resultRows.filter((r) => bookIds.has(r.subjectId));
    rowsForStage.forEach((r) => claimedSubjectIds.add(r.subjectId));
    const row = buildResultRow(rowsForStage);
    return {
      classId: stage.id,
      stageName: stage.name_ar,
      subjects: rowsForStage.map((r) => ({ subjectId: r.subjectId, subjectName: r.subjectName, marks: r.marks })),
      ...row,
    };
  });

  const otherRows = resultRows.filter((r) => !claimedSubjectIds.has(r.subjectId));
  const otherResults = otherRows.length
    ? {
        subjects: otherRows.map((r) => ({ subjectId: r.subjectId, subjectName: r.subjectName, marks: r.marks })),
        ...buildResultRow(otherRows),
      }
    : null;

  return {
    studentId: student.id,
    studentName: student.name,
    gender: student.gender,
    buildingId: student.buildingId,
    buildingName: student.Building?.name,
    stages: stageSections,
    ...(otherResults ? { otherResults } : {}),
  };
}

const create = asyncHandler(async (req, res) => {
  const studentId = req.body.studentId;
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

// Saves an entire student's result sheet (every subject/book of one stage)
// in one submission, inside a transaction so it's all-or-nothing.
const bulkCreate = asyncHandler(async (req, res) => {
  const studentId = req.body.studentId;
  const marksArr = Array.isArray(req.body.marks) ? req.body.marks : [];

  const student = await Student.findByPk(studentId, { include: [Building, studentStagesInclude] });
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

  const sheet = await buildStudentStageSheet(student);
  return res.status(201).json({ success: true, data: sheet });
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

  const bookIds = await getStageBookIds(classId);

  const students = await Student.findAll({
    where: { buildingId },
    include: [{ model: Class, as: 'Stages', attributes: [], through: { attributes: [] }, where: { id: classId }, required: true }],
    order: [['name', 'ASC']],
  });

  const subjectMap = new Map();

  const data = await Promise.all(
    students.map(async (student) => {
      const allRows = await getResultRowsForStudent(student.id);
      // Only this stage's books count toward this stage's total — a
      // student enrolled in multiple stages must never have another
      // stage's marks leak into this one.
      const resultRows = allRows.filter((r) => bookIds.has(r.subjectId));
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

// Admin: every student's results across every masjid/stage, optionally
// narrowed by buildingId/classId/gender/search (Student ID or name). A
// coordinator (GUDOOMIYE KUXIGEEN) is always hard-locked to their own
// masjid via ownBuildingId — any buildingId they send is ignored, so this
// can never surface another masjid's results via a tampered request. When
// classId is omitted, a student enrolled in multiple stages produces one
// row PER stage (never a combined total) — subjectColumns is the union of
// every book that has at least one result among the returned rows.
const getAll = asyncHandler(async (req, res) => {
  const where = {};
  const forcedBuildingId = ownBuildingId(req.user);
  if (forcedBuildingId) {
    where.buildingId = forcedBuildingId;
  } else if (req.query.buildingId) {
    where.buildingId = Number(req.query.buildingId);
  }
  if (req.query.gender) where.gender = req.query.gender;
  if (req.query.search) {
    const term = String(req.query.search).trim();
    where[Op.or] = [
      { id: { [Op.like]: `%${term}%` } },
      { name: { [Op.like]: `%${term}%` } },
    ];
  }
  const requestedClassId = req.query.classId ? Number(req.query.classId) : null;

  const stageWhere = requestedClassId ? { id: requestedClassId } : {};
  const students = await Student.findAll({
    where,
    include: [
      { model: Building, attributes: ['id', 'name'] },
      { model: Class, as: 'Stages', attributes: ['id', 'name_ar'], through: { attributes: [] }, where: stageWhere, required: true },
    ],
    order: [['name', 'ASC']],
  });

  const subjectMap = new Map();
  const rowsPerStudent = await Promise.all(
    students.map(async (student) => {
      const allRows = await getResultRowsForStudent(student.id);
      const perStage = await Promise.all(
        student.Stages.map(async (stage) => {
          const bookIds = await getStageBookIds(stage.id);
          const resultRows = allRows.filter((r) => bookIds.has(r.subjectId));
          resultRows.forEach((row) => {
            if (!subjectMap.has(row.subjectId)) subjectMap.set(row.subjectId, row.subjectName);
          });
          const row = buildResultRow(resultRows);
          return {
            studentId: student.id,
            studentName: student.name,
            gender: student.gender,
            buildingName: student.Building?.name,
            stageName: stage.name_ar,
            ...row,
          };
        }),
      );
      return perStage;
    })
  );

  const data = rowsPerStudent.flat();
  const subjectColumns = Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
  return res.json({ success: true, data, subjectColumns });
});

const getForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.studentId, {
    include: [
      { model: Building, attributes: ['id', 'name', 'resultsVisible'] },
      studentStagesInclude,
    ],
  });
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  // Only the student's own self-view is gated by their masjid's toggle —
  // admin/coordinator reach this same endpoint too (e.g. from the
  // Results Registration and Student Report pages) and must keep working
  // regardless of the toggle.
  if (req.user.userType === 'student' && student.Building?.resultsVisible === false) {
    return res.status(403).json({
      success: false,
      message: 'Results are not currently available for your masjid. Please contact your masjid administrator.',
    });
  }

  const sheet = await buildStudentStageSheet(student);
  return res.json({ success: true, data: sheet });
});

// Student-ID lookup used by the "Search by Student ID" tool. Admin can look
// up anyone; coordinators are restricted to their own masjid — this
// is the server-side enforcement, the frontend never decides access.
const search = asyncHandler(async (req, res) => {
  const studentId = req.query.studentId ? String(req.query.studentId).trim() : '';
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'studentId is required' });
  }

  const student = await Student.findByPk(studentId, {
    include: [
      { model: Building, attributes: ['id', 'name'] },
      studentStagesInclude,
    ],
  });

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found. Please check the Student ID and try again.' });
  }

  const own = ownBuildingId(req.user);
  if (own != null && student.buildingId !== own) {
    return res.status(403).json({ success: false, message: "You are not authorized to view this student's results." });
  }

  const sheet = await buildStudentStageSheet(student);
  return res.json({ success: true, data: sheet });
});

module.exports = { create, bulkCreate, update, remove, getByClass, getAll, getForStudent, search };
