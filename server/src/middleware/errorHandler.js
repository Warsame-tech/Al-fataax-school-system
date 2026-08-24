module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path;
    return res.status(409).json({
      success: false,
      message: field
        ? `A record with this ${field} already exists.`
        : 'A record with these values already exists.',
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'This record cannot be deleted or saved because it is still referenced by other records.',
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  console.error(err);
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};
