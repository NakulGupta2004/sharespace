const express = require('express');
const { authenticate } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { listingId, startDate, endDate, notes, barterItem } = req.body;
    const userId = req.user.userId;

    console.log('Booking request:', { listingId, startDate, endDate, userId });

    // Validate required fields
    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: 'Listing ID is required'
      });
    }

    // Get listing details
    const listing = await Listing.findById(listingId);
    if (!listing) {
      console.error('Booking creation failed: Listing not found', { listingId });
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if user is trying to book their own listing
    if (listing.ownerId.toString() === userId) {
      console.error('Booking creation failed: User tried to book own listing', { listingId, ownerId: listing.ownerId, userId });
      return res.status(400).json({
        success: false,
        message: 'Cannot book your own listing'
      });
    }

    let bookingData = {
      userId,
      listingId,
      notes,
      status: 'pending'
    };

    // Handle pricing type logic
    if (listing.pricing?.type === 'rent') {
      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required for rental bookings'
        });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      if (start < now) {
        return res.status(400).json({
          success: false,
          message: 'Start date cannot be in the past'
        });
      }
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
      // Booking conflict check removed: allow multiple bookings for same dates
      // Calculate total amount
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const dailyRate = listing.pricing?.dailyRate || 0;
      bookingData.startDate = start;
      bookingData.endDate = end;
      bookingData.totalAmount = days * dailyRate;
    } else if (listing.pricing?.type === 'sell') {
      bookingData.totalAmount = listing.pricing?.sellPrice || 0;
    } else if (listing.pricing?.type === 'barter') {
      bookingData.totalAmount = 0;
      if (barterItem) bookingData.barterItem = barterItem;
    } else if (listing.pricing?.type === 'free') {
      bookingData.totalAmount = 0;
    }

    // Create booking
    const booking = new Booking(bookingData);
    await booking.save();
    console.log('Booking created:', {
      bookingId: booking._id,
      status: booking.status,
      listingId: booking.listingId,
      ownerId: listing.ownerId,
      userId: booking.userId
    });

    // Populate user and listing details
    await booking.populate([
      { path: 'userId', select: 'name email' },
      { path: 'listingId', select: 'title images pricing location ownerId' }
    ]);

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating booking'
    });
  }
});

// @route   GET /api/bookings/my
// @desc    Get current user's bookings
// @access  Private
router.get('/my', authenticate, async (req, res) => {
  try {
    const { filter } = req.query;
    let query = { userId: req.user.userId };

    // Apply filter
    if (filter && filter !== 'all') {
      query.status = filter;
    }

    const bookings = await Booking.find(query)
      .populate('listingId', 'title images category pricing location ownerId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
});

// @route   GET /api/bookings/received
// @desc    Get bookings for user's listings
// @access  Private
router.get('/received', authenticate, async (req, res) => {
  try {
    const { filter } = req.query;
    
    console.log('Received bookings request for user:', req.user.userId);
    
    // Get user's listings
    const userListings = await Listing.find({ ownerId: req.user.userId }).select('_id');
    const listingIds = userListings.map(listing => listing._id);
    
      console.log('User has listings:', listingIds.length, 'listingIds:', listingIds);

    let query = { listingId: { $in: listingIds } };

    // Apply filter
    if (filter && filter !== 'all') {
      query.status = filter;
    }

      const bookings = await Booking.find(query)
        .populate('listingId', 'title images category pricing location ownerId')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
      console.log('Found bookings for user listings:', bookings.length, 'bookings:', bookings.map(b => ({ id: b._id, status: b.status, listingId: b.listingId._id })));

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error('Get received bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching received bookings'
    });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('listingId', 'ownerId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions - only booking creator or listing owner can update
    const bookingCreatorId = booking.userId.toString();
    const listingOwnerId = booking.listingId.ownerId.toString();
    const currentUserId = req.user.userId.toString();
    
    const isBookingCreator = bookingCreatorId === currentUserId;
    const isListingOwner = listingOwnerId === currentUserId;

    console.log('Authorization check:', {
      bookingCreatorId,
      listingOwnerId,
      currentUserId,
      isBookingCreator,
      isListingOwner,
      userObject: req.user
    });

    if (!isBookingCreator && !isListingOwner) {
      console.log('Authorization failed - user not authorized');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    console.log('Authorization passed - updating booking status to:', status);

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: 'Booking status updated successfully'
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating booking status'
    });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings (admin or future implementation)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('listingId', 'title images pricing')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
});

module.exports = router;