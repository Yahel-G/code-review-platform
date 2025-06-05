const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const { ApiError } = require('./error.middleware');

/**
 * Middleware to validate request data using express-validator
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Format errors to be more client-friendly
  const extractedErrors = [];
  errors.array().map((err) =>
    extractedErrors.push({ [err.param]: err.msg })
  );

  // Pass extractedErrors as the 'errors' argument, true for 'isOperational'. Stack will be auto-captured.
  throw new ApiError(
    StatusCodes.UNPROCESSABLE_ENTITY,
    'Validation failed',
    extractedErrors, // errors array
    true // isOperational
    // stack will be captured by ApiError constructor
  );
};

/**
 * Middleware to validate MongoDB ObjectId in request parameters
 * @param {string} paramName - Name of the parameter to validate
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      // Pass an empty array for 'errors', true for 'isOperational'. Stack will be auto-captured.
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Invalid ${paramName} format`,
        [], // errors array (empty for this type of error)
        true // isOperational
        // stack will be captured by ApiError constructor
      );
    }
    
    next();
  };
};

module.exports = {
  validate,
  validateObjectId,
};
