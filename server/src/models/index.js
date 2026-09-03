const sequelize = require('../config/db');
const Building = require('./Building');
const Fan = require('./Fan');
const Class = require('./Class');
const Subject = require('./Subject');
const Student = require('./Student');
const Coordinator = require('./Coordinator');
const User = require('./User');
const Result = require('./Result');
const StudentStage = require('./StudentStage');
const PasswordResetOtp = require('./PasswordResetOtp');

// Building <-> Student
Building.hasMany(Student, { foreignKey: 'buildingId', onDelete: 'RESTRICT' });
Student.belongsTo(Building, { foreignKey: 'buildingId' });

Building.hasMany(Coordinator, { foreignKey: 'buildingId', onDelete: 'RESTRICT' });
Coordinator.belongsTo(Building, { foreignKey: 'buildingId' });

// Class (Educational Stage) <-> Student, many-to-many via
// student_stage_registrations (a student can be enrolled in multiple
// stages over time — see StudentStage.js).
Class.belongsToMany(Student, { through: StudentStage, foreignKey: 'classId', otherKey: 'studentId', as: 'Students' });
Student.belongsToMany(Class, { through: StudentStage, foreignKey: 'studentId', otherKey: 'classId', as: 'Stages' });

Student.hasMany(StudentStage, { foreignKey: 'studentId', onDelete: 'CASCADE' });
StudentStage.belongsTo(Student, { foreignKey: 'studentId' });

Class.hasMany(StudentStage, { foreignKey: 'classId', onDelete: 'RESTRICT' });
StudentStage.belongsTo(Class, { foreignKey: 'classId' });

// Fan <-> Subject (Religious Book)
Fan.hasMany(Subject, { foreignKey: 'fanId', onDelete: 'RESTRICT' });
Subject.belongsTo(Fan, { foreignKey: 'fanId' });

// Class (Educational Stage) <-> Subject (Religious Book), many-to-many via stage_religious_books
Class.belongsToMany(Subject, {
  through: 'stage_religious_books',
  foreignKey: 'stage_id',
  otherKey: 'book_id',
  timestamps: false,
});
Subject.belongsToMany(Class, {
  through: 'stage_religious_books',
  foreignKey: 'book_id',
  otherKey: 'stage_id',
  timestamps: false,
});

// User <-> Student
Student.hasOne(User, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
User.belongsTo(Student, { foreignKey: 'studentId' });

Coordinator.hasOne(User, { foreignKey: 'coordinatorId', onDelete: 'RESTRICT' });
User.belongsTo(Coordinator, { foreignKey: 'coordinatorId' });

// Student / Subject (Religious Book) <-> Result
Student.hasMany(Result, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Result.belongsTo(Student, { foreignKey: 'studentId' });

Subject.hasMany(Result, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
Result.belongsTo(Subject, { foreignKey: 'subjectId' });

// User <-> PasswordResetOtp (Forgot Password flow)
User.hasMany(PasswordResetOtp, { foreignKey: 'userId', onDelete: 'CASCADE' });
PasswordResetOtp.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  Building,
  Fan,
  Class,
  Subject,
  Student,
  Coordinator,
  User,
  Result,
  StudentStage,
  PasswordResetOtp,
};
