const { Building, Fan, Student, Teacher, Coordinator, Class, Subject, Result } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const summary = asyncHandler(async (req, res) => {
  const [totalBuildings, totalFans, totalStudents, totalTeachers, totalCoordinators, totalClasses, totalSubjects, totalResults] =
    await Promise.all([
      Building.count(),
      Fan.count(),
      Student.count(),
      Teacher.count(),
      Coordinator.count(),
      Class.count(),
      Subject.count(),
      Result.count(),
    ]);

  return res.json({
    success: true,
    data: {
      totalBuildings,
      totalFans,
      totalStudents,
      totalTeachers,
      totalCoordinators,
      totalClasses,
      totalSubjects,
      totalResults,
    },
  });
});

module.exports = { summary };
