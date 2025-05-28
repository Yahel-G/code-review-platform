const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for individual code issues (matching Analysis)
const issueSchema = new Schema({
  ruleId: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  line: { type: Number, required: true, min: 1 },
  column: { type: Number, required: true, min: 1 },
  severity: { type: Number, required: true, enum: [1, 2], default: 1 },
});

// Schema for code metrics
const metricsSchema = new Schema({
  linesOfCode: { type: Number, required: true, min: 0 },
  complexity: { type: Number, required: true, min: 1 },
  maintainability: { type: Number, required: true, min: 0, max: 100 },
});

// Review schema
const reviewSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true },
    language: {
      type: String,
      required: true,
      enum: ['javascript', 'typescript', 'python', 'csharp', 'java', 'other'],
      lowercase: true,
      trim: true,
    },
    author: { type: String, ref: 'User', required: true },
    analysis: {
      issues: { type: [issueSchema], default: [] },
      metrics: { type: metricsSchema, required: true },
      suggestions: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for author and creation time
reviewSchema.index({ author: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
