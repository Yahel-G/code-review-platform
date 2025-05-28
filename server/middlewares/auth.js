const jwt = require('jsonwebtoken');
const { ApiError } = require('./error.middleware');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/user.model');

/**
 * Protect routes - verifies JWT and attaches user to req
 */
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authorized, token missing');
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Optionally load user details
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }
    req.user = { id: user._id };
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expired'
      : 'Not authorized, token invalid';
    return next(new ApiError(StatusCodes.UNAUTHORIZED, message));
  }
};
