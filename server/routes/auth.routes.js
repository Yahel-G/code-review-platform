const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');
const authController = require('../controllers/auth.controller');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  validate,
  authController.register
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  validate,
  authController.login
);

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private
router.get('/me', authController.authenticate, authController.getCurrentUser);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user / clear refresh token
// @access  Private
router.post('/logout', authController.authenticate, authController.logout);

module.exports = router;
