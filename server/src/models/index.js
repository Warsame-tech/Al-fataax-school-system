const sequelize = require('../config/db');
const Building = require('./Building');
const Fan = require('./Fan');
const Class = require('./Class');
const Subject = require('./Subject');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Coordinator = require('./Coordinator');
const User = require('./User');
const Result = require('./Result');

// Building <-> Student / Teacher
Building.hasMany(Student, { foreignKey: 'buildingId', onDelete: 'RESTRICT' });
Student.belongsTo(Building, { foreignKey: 'buildingId' });

Building.hasMany(Teacher, { foreignKey: 'buildingId', onDelete: 'RESTRICT' });
Teacher.belongsTo(Building, { foreignKey: 'buildingId' });

Building.hasMany(Coordinator, { foreignKey: 'buildingId', onDelete: 'RESTRICT' });
Coordinator.belongsTo(Building, { foreignKey: 'buildingId' });

// Class (Educational Stage) <-> Student
Class.hasMany(Student, { foreignKey: 'classId', onDelete: 'RESTRICT' });
Student.belongsTo(Class, { foreignKey: 'classId' });

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

// User <-> Teacher / Student
Teacher.hasOne(User, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
User.belongsTo(Teacher, { foreignKey: 'teacherId' });

Student.hasOne(User, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
User.belongsTo(Student, { foreignKey: 'studentId' });

Coordinator.hasOne(User, { foreignKey: 'coordinatorId', onDelete: 'RESTRICT' });
User.belongsTo(Coordinator, { foreignKey: 'coordinatorId' });

// Student / Subject (Religious Book) <-> Result
Student.hasMany(Result, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Result.belongsTo(Student, { foreignKey: 'studentId' });

Subject.hasMany(Result, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
Result.belongsTo(Subject, { foreignKey: 'subjectId' });

module.exports = {
  sequelize,
  Building,
  Fan,
  Class,
  Subject,
  Student,
  Teacher,
  Coordinator,
  User,
  Result,
};
