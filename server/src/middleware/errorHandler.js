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
  // Only trust err.message for explicit application errors (4xx, deliberately
  // thrown with a status). Genuine unanticipated exceptions (500s) never
  // reach the client with their original message — it could contain internal
  // detail (a DB host/port, a file path) that has no business leaving the server.
  const message = status < 500 && err.message ? err.message : 'Internal server error';
  return res.status(status).json({ success: false, message });
};
