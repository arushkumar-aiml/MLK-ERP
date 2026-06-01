function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errors = error.errors || [];

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(error.errors).map((validationError) => validationError.message);
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = `${error.path} is invalid`;
  }

  if (error.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
    message = `${duplicateField} already exists`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    status: statusCode,
    errors,
  });
}

module.exports = { errorHandler, notFoundHandler };
