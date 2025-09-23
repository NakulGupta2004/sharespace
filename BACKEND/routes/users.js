const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
// @route   GET /api/users/contacts
// @desc    Get authenticated user's contacts (friendList)
// @access  Private
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('friendList', 'name email avatar_url _id');
    res.json({ success: true, contacts: user.friendList });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching contacts.' });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// @route   POST /api/users/add-friend/:friendId
// @desc    Add a user to the authenticated user's friendList
// @access  Private
router.post('/add-friend/:friendId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.friendId;

    if (userId === friendId) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself as a friend.' });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.friendList && user.friendList.includes(friendId)) {
      return res.status(400).json({ success: false, message: 'Already in friend list.' });
    }

    if (!user.friendList) user.friendList = [];
    user.friendList.push(friendId);
    await user.save();

    res.json({ success: true, message: 'Friend added successfully.', friend: { _id: friend._id, name: friend.name, email: friend.email, avatar_url: friend.avatar_url } });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ success: false, message: 'Server error adding friend.' });
  }
});

module.exports = router;