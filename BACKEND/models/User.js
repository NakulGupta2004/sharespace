const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        // Validate college email format - more flexible validation
        const collegeDomains = [
          '.edu', '.ac.in', 'college.', 'university.',
          'viit.com', 'vit.edu', 'mit.edu', 'iit.ac.in',
          'nit.ac.in', 'iiit.ac.in', 'bits-pilani.ac.in'
        ];
        return collegeDomains.some(domain => 
          email.toLowerCase().includes(domain)
        );
      },
      message: 'Please provide a valid college email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  college_id: {
    type: String,
    required: [true, 'College ID is required'],
    trim: true,
    maxlength: [50, 'College ID cannot exceed 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: 'Please provide a valid phone number'
    }
  },
  avatar_url: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random&size=128`;
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  email_verification_token: {
    type: String,
    select: false
  },
  email_verification_expires: {
    type: Date,
    select: false
  },
  password_reset_token: {
    type: String,
    select: false
  },
  password_reset_expires: {
    type: Date,
    select: false
  },
  reputation: {
    score: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    ratingsCount: {
      type: Number,
      default: 0
    }
  },
  credits: {
    type: Number,
    default: 100,
    min: 0
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'moderator'],
    default: 'student'
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      bookingUpdates: { type: Boolean, default: true },
      teamInvites: { type: Boolean, default: true }
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: true }
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ college_id: 1 });
userSchema.index({ 'reputation.score': -1 });
userSchema.index({ lastActive: -1 });

// Virtual for user's listings count
userSchema.virtual('listingsCount', {
  ref: 'Listing',
  localField: '_id',
  foreignField: 'ownerId',
  count: true
});

// Virtual for user's successful transactions count
userSchema.virtual('transactionsCount', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'renterId',
  match: { status: 'returned' },
  count: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update reputation
userSchema.methods.updateReputation = function(newRating) {
  const currentTotal = this.reputation.score * this.reputation.ratingsCount;
  this.reputation.ratingsCount += 1;
  this.reputation.score = (currentTotal + newRating) / this.reputation.ratingsCount;
  
  // Round to 1 decimal place
  this.reputation.score = Math.round(this.reputation.score * 10) / 10;
  
  return this.save();
};

// Method to add/subtract credits
userSchema.methods.updateCredits = function(amount, operation = 'add') {
  if (operation === 'add') {
    this.credits += amount;
  } else if (operation === 'subtract') {
    this.credits = Math.max(0, this.credits - amount);
  }
  return this.save();
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.email_verification_token = crypto.createHash('sha256').update(token).digest('hex');
  this.email_verification_expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.password_reset_token = crypto.createHash('sha256').update(token).digest('hex');
  this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return token;
};

// Static method to find user by verification token
userSchema.statics.findByVerificationToken = function(token) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    email_verification_token: hashedToken,
    email_verification_expires: { $gt: Date.now() }
  });
};

// Static method to find user by password reset token
userSchema.statics.findByPasswordResetToken = function(token) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    password_reset_token: hashedToken,
    password_reset_expires: { $gt: Date.now() }
  });
};

module.exports = mongoose.model('User', userSchema);