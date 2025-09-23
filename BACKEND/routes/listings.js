const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Listing = require('../models/Listing');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'listings');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local storage (development)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'listing-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/listings
// @desc    Create a new listing with flexible image handling
// @access  Private
router.post('/', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      condition,
      pricing,
      availability,
      location,
      image_urls, // URLs provided by user as fallback
      tags,
      teamId
    } = req.body;

    console.log('📝 Creating listing:', { title, category, hasFiles: req.files?.length || 0, hasUrls: image_urls?.length || 0 });

    // Handle pricing (parse if it's a string)
    let parsedPricing;
    try {
      if (typeof pricing === 'string') {
        parsedPricing = JSON.parse(pricing);
      } else {
        parsedPricing = pricing;
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing format'
      });
    }

    // Handle image processing with priority system
    let processedImages = [];
    
    // Priority 1: Uploaded files (ignore URLs if files are uploaded)
    if (req.files && req.files.length > 0) {
      console.log('📷 Processing uploaded files:', req.files.length);
      processedImages = req.files.map(file => ({
        url: `${req.protocol}://${req.get('host')}/uploads/listings/${file.filename}`,
        public_id: file.filename,
        alt_text: `${title} - uploaded image`,
        is_uploaded: true
      }));
    } 
    // Priority 2: Use provided URLs if no files uploaded
    else if (image_urls) {
      console.log('🔗 Processing image URLs:', image_urls);
      const urls = Array.isArray(image_urls) ? image_urls : [image_urls];
      processedImages = urls.filter(url => url && url.trim()).map(url => ({
        url: url.trim(),
        public_id: null,
        alt_text: `${title} - URL image`,
        is_uploaded: false
      }));
    }

    // Validation: At least one image required
    if (processedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required (upload file or provide URL)'
      });
    }

    // Create listing
    const listing = new Listing({
      ownerId: req.user.userId,
      teamId: teamId || null,
      title,
      description,
      category,
      subcategory,
      images: processedImages,
      image_urls: image_urls || [],
      condition,
      pricing: parsedPricing,
      availability: availability ? JSON.parse(availability) : {
        isAvailable: true,
        availableFrom: new Date(),
        availableUntil: null
      },
      location: location ? JSON.parse(location) : {
        type: 'campus',
        details: 'On campus'
      },
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : []
    });

    await listing.save();

    // Populate owner info for response
    await listing.populate('ownerId', 'name email avatar_url');

    console.log('✅ Listing created successfully:', listing._id);

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing
    });

  } catch (error) {
    console.error('❌ Create listing error:', error);
    
    // Clean up uploaded files if listing creation fails
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error creating listing',
      error: error.message
    });
  }
});

// @route   GET /api/listings/my/stats
// @desc    Get current user's listing statistics
// @access  Private
router.get('/my/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get total listings count
    const totalListings = await Listing.countDocuments({ ownerId: userId });
    
    // Get active listings count
    const activeListings = await Listing.countDocuments({ 
      ownerId: userId, 
      isActive: true,
      isDeleted: false
    });
    
    // Get rented listings count (check availability.status)
    const rentedListings = await Listing.countDocuments({ 
      ownerId: userId, 
      isActive: true,
      isDeleted: false,
      'availability.status': 'rented'
    });
    
    // Calculate total views (sum of all listing views)
    const viewsAgg = await Listing.aggregate([
      { $match: { ownerId: req.user.userId } },
      { $group: { _id: null, totalViews: { $sum: "$statistics.views" } } }
    ]);
    const totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;
    
    const stats = {
      totalListings,
      activeListings,
      rentedListings,
      totalViews,
      // Mock data for now - these would come from booking/transaction system
      earnedCredits: 0,
      reputation: 4.8,
      completedTransactions: 0
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/listings/my
// @desc    Get current user's listings
// @access  Private
router.get('/my', authenticate, async (req, res) => {
  try {
    const listings = await Listing.find({ ownerId: req.user.userId })
      .populate('ownerId', 'name email avatar_url reputation')
      .sort('-createdAt');
    
    res.json({
      success: true,
      data: listings,
      count: listings.length
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    
    // If it's a database connection error, return empty array instead of 500
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('Could not connect')) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'Database temporarily unavailable'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/listings
// @desc    Get all listings with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      pricing_type,
      condition,
      search,
      page = 1,
      limit = 12,
      sort = '-createdAt'
    } = req.query;

    // Build filter object - use correct field names from model
    const filter = { isActive: true, isDeleted: false };
    
    if (category) filter.category = category;
    if (pricing_type) filter['pricing.type'] = pricing_type;
    if (condition) filter.condition = condition;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    try {
      const listings = await Listing.find(filter)
        .populate('ownerId', 'name email avatar_url reputation')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Listing.countDocuments(filter);

      res.json({
        success: true,
        listings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (populateError) {
      console.log('Population failed, trying without populate:', populateError.message);
      
      // Fallback: get listings without population
      const listings = await Listing.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Listing.countDocuments(filter);

      res.json({
        success: true,
        listings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    }

  } catch (error) {
    console.error('Get listings error:', error);
    console.error('Error stack:', error.stack);
    
    // If it's a database connection error, return empty array instead of 500
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('Could not connect')) {
      return res.json({
        success: true,
        listings: [],
        pagination: {
          current: 1,
          pages: 0,
          total: 0
        },
        message: 'Database temporarily unavailable'
      });
    }
    
    // For other errors, return empty array instead of 500 error to prevent frontend crashes
    res.json({
      success: true,
      listings: [],
      pagination: {
        current: 1,
        pages: 0,
        total: 0
      },
      message: 'Error fetching listings, showing empty state'
    });
  }
});

// @route   GET /api/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format'
      });
    }

    const listing = await Listing.findById(id)
      .populate('ownerId', 'name email avatar_url reputation phone college');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      listing
    });

  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/listings/categories/stats
// @desc    Get category statistics
// @access  Public
router.get('/categories/stats', async (req, res) => {
  try {
    const categories = ['books', 'electronics', 'tools', 'lab-kits'];
    const stats = await Promise.all(
      categories.map(async (category) => {
        const count = await Listing.countDocuments({ 
          category: category, 
          isActive: true, 
          isDeleted: false,
          'availability.status': 'available'
        });
        return { category, count };
      })
    );

    // Get total count
    const totalCount = await Listing.countDocuments({ 
      isActive: true, 
      isDeleted: false,
      'availability.status': 'available'
    });

    res.json({
      success: true,
      categories: stats,
      total: totalCount
    });

  } catch (error) {
    console.error('Category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;