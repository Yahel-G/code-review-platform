const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { 
  analyzeCode, 
  getAnalysisHistory 
} = require('../controllers/analysis.controller');

// Protect all routes with authentication
router.use(protect);

/**
 * @route   POST /api/analyze
 * @desc    Analyze code and get feedback
 * @access  Private
 */
router.post('/', analyzeCode);

/**
 * @route   GET /api/analysis/history
 * @desc    Get user's analysis history
 * @access  Private
 */
router.get('/history', getAnalysisHistory);

module.exports = router;
