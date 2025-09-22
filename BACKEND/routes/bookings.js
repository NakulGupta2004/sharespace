const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/bookings/my
// @desc    Get current user's bookings
// @access  Private
router.get('/my', authenticate, (req, res) => {
  // Temporary implementation - return empty array
  res.json({
    success: true,
    data: [],
    message: 'Bookings feature coming soon'
  });
});

// @route   GET /api/bookings
// @desc    Get all bookings (admin or future implementation)
// @access  Private
router.get('/', authenticate, (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Bookings feature coming soon'
  });
});

module.exports = router;