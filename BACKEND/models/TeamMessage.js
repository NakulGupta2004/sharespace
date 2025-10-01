const mongoose = require('mongoose');

const teamMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
teamMessageSchema.index({ teamId: 1, createdAt: -1 });
teamMessageSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model('TeamMessage', teamMessageSchema);