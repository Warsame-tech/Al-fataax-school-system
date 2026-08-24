module.exports = function authorizeRoles(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return next();
  };
};
