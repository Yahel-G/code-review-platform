const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const feedbackController = require('../controllers/feedback.controller');

// Require authentication
router.use(protect);

// POST /api/feedback
router.post('/', feedbackController.submitFeedback);

module.exports = router;
