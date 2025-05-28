const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/review.controller');

// Public routes
router.get('/', getAllReviews);
router.get('/:id', getReviewById);

// Protected routes
router.use(protect);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
