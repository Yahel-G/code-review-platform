const crypto = require('crypto');
const { submitAISuggestionFeedback } = require('../services/aiAnalysis.service');

/**
 * @desc Submit feedback for AI code suggestions
 * @route POST /api/feedback
 * @access Private
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { code = '', language = '', rating = 0, feedback = '' } = req.body;
    const userId = req.user.id || null;
    if (!code || !language) {
      return res.status(400).json({ message: 'code and language are required' });
    }

    // Normalise rating
    const normalizedRating = Math.min(5, Math.max(0, Number(rating)));

    const hash = crypto.createHash('sha256').update(code).digest('hex');
    await submitAISuggestionFeedback({ userId, codeHash: hash, language, rating: normalizedRating, feedback });
    res.status(200).json({ message: 'Feedback recorded' });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ message: 'Failed to record feedback', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};
