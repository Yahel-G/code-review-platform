const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  ruleId: { 
    type: String, 
    required: true,
    trim: true
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  line: { 
    type: Number, 
    required: true,
    min: 1
  },
  column: { 
    type: Number, 
    required: true,
    min: 1
  },
  severity: { 
    type: Number, 
    required: true,
    enum: [1, 2], // 1 = warning, 2 = error
    default: 1
  },
  // Removed endLine and endColumn as they're not used in our simplified analyzer
});

const metricsSchema = new mongoose.Schema({
  linesOfCode: { 
    type: Number, 
    required: true,
    min: 0
  },
  complexity: { 
    type: Number, 
    required: true,
    min: 1
  },
  maintainability: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  // Removed halstead metrics as they're not used in our simplified version
});

const analysisSchema = new mongoose.Schema(
  {
    user: { 
      type: String, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    language: {
      type: String,
      required: true,
      enum: ['javascript', 'typescript', 'python', 'csharp', 'java', 'other'],
      lowercase: true,
      trim: true
    },
    issues: [issueSchema],
    metrics: {
      type: metricsSchema,
      required: true,
      validate: {
        validator: function(v) {
          return v && 
                 v.linesOfCode >= 0 && 
                 v.complexity >= 1 && 
                 v.maintainability >= 0 && 
                 v.maintainability <= 100;
        },
        message: props => `Invalid metrics: ${JSON.stringify(props.value)}`
      }
    },
    codeSnippet: {
      type: String,
      required: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Add indexes
analysisSchema.index({ user: 1, createdAt: -1 });

// Add static methods
analysisSchema.statics.findByUser = async function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis;
