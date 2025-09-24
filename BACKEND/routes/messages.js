const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const Message = require('../models/Message');
const router = express.Router();

// @route   POST /api/messages
// @desc    Send a message
// @desc    Send a message (no longer saved to MongoDB)
router.post('/', authenticate, async (req, res) => {
  const { receiverId, content, listingId } = req.body;
  if (!receiverId || !content) {
    return res.status(400).json({
      success: false,
      message: 'Receiver ID and content are required'
    });
  }
  if (!content.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message content cannot be empty'
    });
  }
  // Instead of saving, just echo the message back
  res.status(200).json({
    success: true,
    data: {
      senderId: req.user.userId,
      receiverId,
      content,
      listingId,
      createdAt: new Date()
    },
    message: 'Message sent (not saved)'
  });
});

// @route   GET /api/messages/conversation/:userId/:listingId
// @desc    Get conversation between two users for a specific listing
// @access  Private
router.get('/conversation/:userId/:listingId', authenticate, async (req, res) => {
  // No messages are saved or fetched
  res.json({
    success: true,
    data: [],
    count: 0
  });
});

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', authenticate, async (req, res) => {
  // No conversations are saved or fetched
  res.json({
    success: true,
    data: [],
    count: 0
  });
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', authenticate, async (req, res) => {
  // No messages are saved or updated
  res.json({
    success: true,
    message: 'Message marked as read (no-op)'
  });
});

module.exports = router;