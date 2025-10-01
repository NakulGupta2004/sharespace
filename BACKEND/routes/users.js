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

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, bio, location, social_links } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          name,
          phone,
          bio,
          location,
          social_links
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // You can customize these stats based on your actual models
    const stats = {
      totalListings: 12, // Mock data - replace with actual query
      activeListings: 8,
      totalViews: 342,
      totalBookings: 25,
      rating: 4.8,
      joinedDate: '2024-01-15'
    };

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stats'
    });
  }
});

// @route   GET /api/users/all
// @desc    Get all registered users (for team creation)
// @access  Private
router.get('/all', authenticate, async (req, res) => {
  try {
    const users = await User.find({}, 'name email avatar_url _id');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users.' });
  }
});

module.exports = router;