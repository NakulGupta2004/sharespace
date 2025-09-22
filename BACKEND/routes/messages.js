const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const Message = require('../models/Message');
const router = express.Router();

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiverId, listingId, content } = req.body;
    const senderId = req.user.id;

    // Validate required fields
    if (!receiverId || !listingId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID, listing ID, and content are required'
      });
    }

    // Validate content length
    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    // Create message
    const message = new Message({
      senderId,
      receiverId,
      listingId,
      content: content.trim()
    });

    await message.save();

    // Populate sender details
    await message.populate('senderId', 'name email');

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending message'
    });
  }
});

// @route   GET /api/messages/conversation/:userId/:listingId
// @desc    Get conversation between two users for a specific listing
// @access  Private
router.get('/conversation/:userId/:listingId', authenticate, async (req, res) => {
  try {
    const { userId, listingId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      listingId,
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    })
    .populate('senderId', 'name email')
    .populate('receiverId', 'name email')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        listingId,
        senderId: userId,
        receiverId: currentUserId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching conversation'
    });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: mongoose.Types.ObjectId(userId) },
            { receiverId: mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            listingId: '$listingId',
            otherUser: {
              $cond: {
                if: { $eq: ['$senderId', mongoose.Types.ObjectId(userId)] },
                then: '$receiverId',
                else: '$senderId'
              }
            }
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$receiverId', mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.otherUser',
          foreignField: '_id',
          as: 'otherUser'
        }
      },
      {
        $lookup: {
          from: 'listings',
          localField: '_id.listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          otherUser: { $arrayElemAt: ['$otherUser', 0] },
          listing: { $arrayElemAt: ['$listing', 0] }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      data: conversations,
      count: conversations.length
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching conversations'
    });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only the receiver can mark as read
    if (message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }

    message.isRead = true;
    await message.save();

    res.json({
      success: true,
      data: message,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking message as read'
    });
  }
});

module.exports = router;