const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `user_${uuidv4()}`,
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot be longer than 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be longer than 500 characters'],
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    badges: [
      {
        name: String,
        description: String,
        icon: String,
        earnedAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
    refreshToken: {
      type: String,
      select: false
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    settings: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        desktop: {
          type: Boolean,
          default: true,
        },
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ username: 'text', email: 'text' });
userSchema.index({ points: -1 });

// Virtual for user's reviews
userSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'author',
});

// Virtual for user's comments
userSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'author',
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();

  try {
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Unable to login');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }
  return user;
};

// Method to get public profile
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.__v;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;

  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
