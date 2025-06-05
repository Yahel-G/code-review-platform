const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = Array.isArray(errors) ? errors : []; // Ensure errors is always an array
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
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || 'An error occurred';
    let preservedErrors = [];

    // If the incoming error (err) has an 'errors' property that's an array, use it.
    // This is crucial if 'err' is an ApiError instance from validation.middleware.js
    // but isn't recognized by 'instanceof' due to Jest module caching.
    if (Array.isArray(err.errors)) {
      preservedErrors = err.errors;
    }
    
    // Determine isOperational. Default to false if not an ApiError instance.
    // If err has an isOperational property, respect it, otherwise assume not operational.
    const isOperational = typeof err.isOperational === 'boolean' ? err.isOperational : false;

    // Pass preservedErrors as the 'errors' argument, and err.stack as 'stack'
    error = new ApiError(statusCode, message, preservedErrors, isOperational, err.stack);
  }
  
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = err; // err is an ApiError instance from errorConverter
  const response = {
    status: err.status, // Use err.status as set by ApiError
    message,
  };

  // Include the detailed errors array if present (e.g., from validation middleware)
  if (err.errors && err.errors.length > 0) {
    response.errors = err.errors;
  }

  // Include stack trace only in development or for non-operational errors
  if (process.env.NODE_ENV === 'development' || !err.isOperational) {
    response.stack = err.stack;
  }

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
