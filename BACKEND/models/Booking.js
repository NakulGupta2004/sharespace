const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  startDate: {
    type: Date,
    required: false
  },
  endDate: {
    type: Date,
    required: false
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'active'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentOrderId: {
    type: String,
    default: null
  },
  paymentId: {
    type: String,
    default: null
  },
  paymentDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    maxlength: 500
  },
  barterItem: {
    type: String,
    maxlength: 500,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that endDate is after startDate only for rent type
bookingSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    if (this.endDate <= this.startDate) {
      next(new Error('End date must be after start date'));
      return;
    }
  }
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ listingId: 1, startDate: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);