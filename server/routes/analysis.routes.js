const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/rateLimit');
const analysisController = require('../controllers/analysis.controller');

// Protect all routes with authentication
router.use(protect);

// POST /api/analyze  → this router is mounted at /api/analyze
router.post('/', aiLimiter, analysisController.analyzeCode);

// GET /api/analyze/history
router.get('/history', analysisController.getAnalysisHistory);

module.exports = router;
