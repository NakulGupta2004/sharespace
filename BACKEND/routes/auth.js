
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/auth/me
// @desc    Get current user info from JWT
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: {
      id: user._id,
      name: user.name,
      email: user.email,
      college_id: user.college_id,
      is_verified: user.verified,
      credits: user.credits,
      reputation: user.reputation
    } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('🔵 Registration attempt:', req.body);
    const { name, email, password, college_id, phone } = req.body;

    // Validation
    if (!name || !email || !password || !college_id) {
      console.log('❌ Missing required fields:', { name: !!name, email: !!email, password: !!password, college_id: !!college_id });
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { college_id }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or college ID already exists'
      });
    }

    // Validate college email domain (basic validation)
    const collegeDomains = [
      '.edu', '.ac.in', 'college.', 'university.',
      'viit.com', 'vit.edu', 'mit.edu', 'iit.ac.in',
      'nit.ac.in', 'iiit.ac.in', 'bits-pilani.ac.in'
    ];
    const isCollegeEmail = collegeDomains.some(domain => 
      email.toLowerCase().includes(domain)
    );

    if (!isCollegeEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please use your official college email address'
      });
    }

    // Create verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      college_id,
      phone,
      email_verification_token: emailVerificationToken,
      email_verification_expires: emailVerificationExpires,
      is_verified: false // Set to true for development, false for production
    });

    await user.save();

    // For development, we'll auto-verify the user
    // In production, you would send an email here
    if (process.env.NODE_ENV === 'development') {
      user.verified = true;
      user.email_verification_token = undefined;
      user.email_verification_expires = undefined;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college_id: user.college_id,
        is_verified: user.verified,
        credits: user.credits,
        reputation: user.reputation
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });

    // Validation
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password');

    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is verified (disabled for development)
    if (process.env.NODE_ENV === 'production' && !user.verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Update last login
    user.lastActive = Date.now();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    console.log('Login successful for user:', user.email);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college_id: user.college_id,
        is_verified: user.verified,
        credits: user.credits,
        reputation: user.reputation
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      email_verification_token: token,
      email_verification_expires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.is_verified = true;
    user.email_verification_token = undefined;
    user.email_verification_expires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.password_reset_token = resetToken;
    user.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // TODO: Send email with reset link
    // For development, return the token
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;