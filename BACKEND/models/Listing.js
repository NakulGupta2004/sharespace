const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null // null for personal items, teamId for team-owned items
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['books', 'electronics', 'tools', 'lab-kits', 'sports', 'clothing', 'furniture', 'other'],
      message: 'Category must be one of: books, electronics, tools, lab-kits, sports, clothing, furniture, other'
    }
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      default: null // null for URL-based images, cloudinary public_id for uploaded images
    },
    alt_text: {
      type: String,
      default: ''
    },
    is_uploaded: {
      type: Boolean,
      default: false // true if uploaded file, false if URL provided
    }
  }],
  // URL-based images (fallback when no files uploaded)
  image_urls: [{
    type: String,
    validate: {
      validator: function(url) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Please provide a valid image URL'
    }
  }],
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: {
      values: ['excellent', 'good', 'fair', 'poor'],
      message: 'Condition must be one of: excellent, good, fair, poor'
    }
  },
  pricing: {
    type: {
      type: String,
      required: [true, 'Pricing type is required'],
      enum: {
        values: ['rent', 'sell', 'free', 'barter'],
        message: 'Pricing type must be one of: rent, sell, free, barter'
      }
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative'],
      validate: {
        validator: function(value) {
          return this.pricing.type !== 'rent' || value != null;
        },
        message: 'Hourly rate is required for rental items'
      }
    },
    dailyRate: {
      type: Number,
      min: [0, 'Daily rate cannot be negative'],
      validate: {
        validator: function(value) {
          return this.pricing.type !== 'rent' || value != null;
        },
        message: 'Daily rate is required for rental items'
      }
    },
    sellPrice: {
      type: Number,
      min: [0, 'Sell price cannot be negative'],
      validate: {
        validator: function(value) {
          return this.pricing.type !== 'sell' || value != null;
        },
        message: 'Sell price is required for items being sold'
      }
    },
    depositAmount: {
      type: Number,
      min: [0, 'Deposit amount cannot be negative'],
      default: 0
    }
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance', 'unavailable'],
      default: 'available'
    },
    schedule: [{
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date,
        required: true
      },
      recurring: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none'
      }
    }],
    blackoutDates: [{
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date,
        required: true
      },
      reason: {
        type: String,
        default: 'Unavailable'
      }
    }]
  },
  location: {
    building: {
      type: String,
      trim: true,
      maxlength: [100, 'Building name cannot exceed 100 characters']
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, 'Room cannot exceed 50 characters']
    },
    meetingPoint: {
      type: String,
      trim: true,
      maxlength: [200, 'Meeting point cannot exceed 200 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  specifications: {
    brand: String,
    model: String,
    year: Number,
    color: String,
    size: String,
    weight: String,
    isbn: String, // for books
    edition: String, // for books
    author: String, // for books
    customFields: [{
      name: { type: String, required: true },
      value: { type: String, required: true }
    }]
  },
  damageHistory: [{
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Damage description cannot exceed 500 characters']
    },
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  qrCode: {
    id: {
      type: String,
      unique: true,
      sparse: true
    },
    url: String,
    generatedAt: Date
  },
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    interested: {
      type: Number,
      default: 0
    },
    bookings: {
      type: Number,
      default: 0
    },
    successfulRentals: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
listingSchema.index({ ownerId: 1 });
listingSchema.index({ teamId: 1 });
listingSchema.index({ category: 1 });
listingSchema.index({ 'availability.status': 1 });
listingSchema.index({ 'pricing.type': 1 });
listingSchema.index({ 'pricing.dailyRate': 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ 'statistics.rating.average': -1 });
listingSchema.index({ 'statistics.views': -1 });
listingSchema.index({ tags: 1 });

// Text index for search functionality
listingSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'specifications.brand': 'text',
  'specifications.model': 'text'
});

// Virtual for checking if item is currently available
listingSchema.virtual('isCurrentlyAvailable').get(function() {
  if (this.availability.status !== 'available') return false;
  
  const now = new Date();
  
  // Check if current time falls within any blackout dates
  const isBlackedOut = this.availability.blackoutDates.some(blackout => 
    now >= blackout.from && now <= blackout.to
  );
  
  return !isBlackedOut;
});

// Virtual for primary image
listingSchema.virtual('primaryImage').get(function() {
  return this.images && this.images.length > 0 ? this.images[0].url : null;
});

// Virtual for formatted price
listingSchema.virtual('formattedPrice').get(function() {
  if (this.pricing.type === 'free') return 'Free';
  if (this.pricing.type === 'barter') return 'Barter';
  
  if (this.pricing.type === 'rent') {
    const daily = this.pricing.dailyRate ? `₹${this.pricing.dailyRate}/day` : '';
    const hourly = this.pricing.hourlyRate ? `₹${this.pricing.hourlyRate}/hour` : '';
    return [daily, hourly].filter(Boolean).join(' • ');
  }
  
  if (this.pricing.type === 'sell') {
    return `₹${this.pricing.sellPrice}`;
  }
  
  return 'Contact for pricing';
});

// Method to increment view count
listingSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};

// Method to increment interested count
listingSchema.methods.incrementInterested = function() {
  this.statistics.interested += 1;
  return this.save();
};

// Method to update rating
listingSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.statistics.rating.average * this.statistics.rating.count;
  this.statistics.rating.count += 1;
  this.statistics.rating.average = (currentTotal + newRating) / this.statistics.rating.count;
  
  // Round to 1 decimal place
  this.statistics.rating.average = Math.round(this.statistics.rating.average * 10) / 10;
  
  return this.save();
};

// Method to generate QR code
listingSchema.methods.generateQRCode = async function() {
  const QRCode = require('qrcode');
  const { v4: uuidv4 } = require('uuid');
  
  if (!this.qrCode.id) {
    this.qrCode.id = uuidv4();
  }
  
  const qrData = JSON.stringify({
    listingId: this._id,
    qrId: this.qrCode.id,
    type: 'listing',
    timestamp: Date.now()
  });
  
  try {
    this.qrCode.url = await QRCode.toDataURL(qrData);
    this.qrCode.generatedAt = new Date();
    await this.save();
    return this.qrCode.url;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

// Method to check availability for specific dates
listingSchema.methods.isAvailableForDates = function(startDate, endDate) {
  if (this.availability.status !== 'available') return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check against blackout dates
  const hasConflict = this.availability.blackoutDates.some(blackout => {
    const blackoutStart = new Date(blackout.from);
    const blackoutEnd = new Date(blackout.to);
    
    return (start <= blackoutEnd && end >= blackoutStart);
  });
  
  return !hasConflict;
};

// Static method for search
listingSchema.statics.search = function(query, filters = {}) {
  const searchQuery = { isActive: true, isDeleted: false };
  
  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Category filter
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  // Price range filter
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    searchQuery.$or = [
      {
        'pricing.type': 'rent',
        'pricing.dailyRate': {
          ...(filters.minPrice !== undefined && { $gte: filters.minPrice }),
          ...(filters.maxPrice !== undefined && { $lte: filters.maxPrice })
        }
      },
      {
        'pricing.type': 'sell',
        'pricing.sellPrice': {
          ...(filters.minPrice !== undefined && { $gte: filters.minPrice }),
          ...(filters.maxPrice !== undefined && { $lte: filters.maxPrice })
        }
      }
    ];
  }
  
  // Availability filter
  if (filters.availableOnly) {
    searchQuery['availability.status'] = 'available';
  }
  
  // Condition filter
  if (filters.condition) {
    searchQuery.condition = { $in: filters.condition };
  }
  
  // Location filter
  if (filters.building) {
    searchQuery['location.building'] = filters.building;
  }
  
  return this.find(searchQuery)
    .populate('ownerId', 'name avatar_url reputation')
    .populate('teamId', 'name')
    .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 });
};

module.exports = mongoose.model('Listing', listingSchema);