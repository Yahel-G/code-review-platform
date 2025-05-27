const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const errorConverter = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || 'An error occurred';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const { statusCode, status, message } = err;
  const response = {
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Log the error
  logger.error(
    `${statusCode || 500} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip} - Stack: ${err.stack}`
  );

  // Send the error response
  res.status(statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(response);
};

const notFound = (req, res, next) => {
  const error = new ApiError(
    StatusCodes.NOT_FOUND,
    `Not Found - ${req.originalUrl}`
  );
  next(error);
};

module.exports = {
  ApiError,
  errorConverter,
  errorHandler,
  notFound,
};
