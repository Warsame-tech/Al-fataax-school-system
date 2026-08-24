// For student-role requests, overwrites the requested studentId with the
// caller's own linked studentId before the controller runs, so a student can
// never view another student's results by editing the URL/request.
module.exports = function scopeStudentToSelf(req, res, next) {
  if (req.user.userType === 'student') {
    req.params.studentId = req.user.studentId;
  }
  return next();
};
