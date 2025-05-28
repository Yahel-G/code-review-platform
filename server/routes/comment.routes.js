const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { protect } = require('../middlewares/auth');

// Get comments for a review
router.get('/', async (req, res) => {
  try {
    const { reviewId } = req.query;
    if (!reviewId) {
      return res.status(400).json({ message: 'Review ID is required' });
    }
    
    const comments = await Comment.find({ reviewId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
      
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new comment
router.post('/', protect, async (req, res) => {
  try {
    const { content, reviewId } = req.body;
    
    if (!content || !reviewId) {
      return res.status(400).json({ message: 'Content and review ID are required' });
    }
    
    const newComment = new Comment({
      content,
      reviewId,
      user: req.user.id
    });
    
    await newComment.save();
    
    // Populate user data for the response
    await newComment.populate('user', 'username');
    
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
