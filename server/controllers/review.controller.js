const Review = require('../models/review.model');
const { ApiError } = require('../middlewares/error.middleware');
const { StatusCodes } = require('http-status-codes');

// GET /api/reviews
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/:id
exports.getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate('author', 'username');
    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, code, language, analysis } = req.body;
    const review = new Review({ title, code, language, analysis, author: userId });
    await review.save();
    const populated = await review.populate('author', 'username');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// PUT /api/reviews/:id
exports.updateReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const review = await Review.findById(req.params.id);
    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }
    if (review.author.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to update this review');
    }
    Object.assign(review, req.body);
    await review.save();
    const populated = await review.populate('author', 'username');
    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const review = await Review.findById(req.params.id);
    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }
    if (review.author.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to delete this review');
    }
    await review.remove();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
