const { Schema, model, Types } = require('mongoose');

const feedbackSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: false },
    codeHash: { type: String, required: true },
    language: { type: String, required: true },
    feedback: { type: String, default: '' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true }
);

module.exports = model('Feedback', feedbackSchema);
