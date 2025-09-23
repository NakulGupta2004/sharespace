const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order for booking payment
// @access  Private
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId)
      .populate('listingId', 'title ownerId')
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the booking creator
    if (booking.userId._id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking'
      });
    }

    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be confirmed before payment'
      });
    }

    // Check if already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid'
      });
    }

    // Create Razorpay order
    const options = {
      amount: booking.totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId,
        listingTitle: booking.listingId.title,
        userId: booking.userId._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    // Update booking with payment details
    booking.paymentOrderId = order.id;
    booking.paymentStatus = 'pending';
    await booking.save();

    console.log('Razorpay order created:', order.id, 'for booking:', bookingId);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      booking: {
        id: booking._id,
        title: booking.listingId.title,
        amount: booking.totalAmount
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order'
    });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Generate signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Find booking and update payment status
    const booking = await Booking.findById(bookingId)
      .populate('listingId', 'ownerId title')
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.paymentId = razorpay_payment_id;
    booking.paymentDate = new Date();
    booking.status = 'active'; // Update status to active after payment
    await booking.save();

    // Add earnings to seller's account
    const seller = await User.findById(booking.listingId.ownerId);
    if (seller) {
      seller.totalEarnings = (seller.totalEarnings || 0) + booking.totalAmount;
      seller.credits = (seller.credits || 0) + booking.totalAmount;
      await seller.save();
    }

    console.log('Payment verified successfully for booking:', bookingId);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentId: booking.paymentId,
        totalAmount: booking.totalAmount
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment'
    });
  }
});

// @route   GET /api/payments/earnings
// @desc    Get user's earnings from payments
// @access  Private
router.get('/earnings', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get paid bookings for user's listings
    const paidBookings = await Booking.find({
      paymentStatus: 'paid'
    })
    .populate({
      path: 'listingId',
      match: { ownerId: req.user.userId },
      select: 'title ownerId'
    })
    .populate('userId', 'name email');

    // Filter out bookings where listingId is null (not user's listings)
    const userEarnings = paidBookings.filter(booking => booking.listingId);

    const totalEarnings = userEarnings.reduce((total, booking) => total + booking.totalAmount, 0);

    res.json({
      success: true,
      data: {
        totalEarnings,
        userCredits: user.credits || 0,
        recentPayments: userEarnings.slice(0, 10) // Last 10 payments
      }
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings'
    });
  }
});

module.exports = router;