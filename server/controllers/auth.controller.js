const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { StatusCodes } = require('http-status-codes');
const { ApiError } = require('../middlewares/error.middleware');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { emitToAll } = require('../socket');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Set token cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  
  res.cookie('refreshToken', token, cookieOptions);
};

// Register a new user
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'User with this email or username already exists'
      );
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in cookie
    setTokenCookie(res, refreshToken);

    // Remove sensitive data before sending response
    user.password = undefined;
    user.refreshToken = undefined;

    // Emit user registered event
    emitToAll('userRegistered', { userId: user._id, username: user.username });

    res.status(StatusCodes.CREATED).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// User login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password'
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password'
      );
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in cookie
    setTokenCookie(res, refreshToken);

    // Remove sensitive data before sending response
    user.password = undefined;
    user.refreshToken = undefined;

    res.status(StatusCodes.OK).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    res.status(StatusCodes.OK).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token
const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'No refresh token provided');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    // Generate new access token
    const token = generateToken(user._id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// User logout
const logout = async (req, res, next) => {
  try {
    // Clear refresh token from user
    await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { refreshToken: 1 } },
      { new: true }
    );

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error) {
    next(error);
  }
};

// Middleware to authenticate requests
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authorized to access this route');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Not authorized'));
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshToken,
  logout,
  authenticate,
};
