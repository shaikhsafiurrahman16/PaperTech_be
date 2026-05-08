function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  console.error(err);
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined,
  });
}

module.exports = { errorHandler };
