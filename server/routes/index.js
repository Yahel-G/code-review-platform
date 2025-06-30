const express = require('express');
const router = express.Router();
const { notFound } = require('../middlewares/error.middleware');

// Import route handlers
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const reviewRoutes = require('./review.routes');
const commentRoutes = require('./comment.routes');
const analysisRoutes = require('./analysis.routes');
const feedbackRoutes = require('./feedback.routes');

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);
router.use('/comments', commentRoutes);
router.use('/analyze', analysisRoutes);
router.use('/feedback', feedbackRoutes);

// 404 handler for API routes
router.use('/api/*', notFound);

module.exports = router;
