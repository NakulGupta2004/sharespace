const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: false // allow general chat
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ listingId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);