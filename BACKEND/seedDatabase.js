const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Listing = require('./models/Listing');

const sampleListings = [
  {
    title: "MacBook Pro 13-inch 2022",
    description: "Barely used MacBook Pro with M2 chip. Perfect for coding and design work. Includes original charger and box.",
    category: "electronics",
    subcategory: "laptops",
    condition: "like-new",
    pricing: {
      type: "rent",
      amount: 50,
      duration: "per day",
      currency: "USD"
    },
    availability: {
      status: "available",
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    location: "Campus Library",
    images: [
      {
        url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500",
        alt_text: "MacBook Pro on desk",
        is_uploaded: false
      }
    ],
    tags: ["laptop", "macbook", "apple", "coding", "development"],
    status: "active"
  },
  {
    title: "Advanced Calculus Textbook",
    description: "Essential textbook for Calculus III. Excellent condition with minimal highlighting. Great for mathematics students.",
    category: "books",
    subcategory: "textbooks",
    condition: "good",
    pricing: {
      type: "rent",
      amount: 25,
      duration: "per semester",
      currency: "USD"
    },
    availability: {
      status: "available"
    },
    location: "Mathematics Building",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
        alt_text: "Calculus textbook",
        is_uploaded: false
      }
    ],
    tags: ["textbook", "calculus", "mathematics", "study"],
    status: "active"
  },
  {
    title: "Digital Multimeter",
    description: "Professional-grade digital multimeter perfect for electronics labs and projects. Includes test leads and manual.",
    category: "tools",
    subcategory: "measurement",
    condition: "excellent",
    pricing: {
      type: "rent",
      amount: 15,
      duration: "per week",
      currency: "USD"
    },
    availability: {
      status: "available"
    },
    location: "Engineering Lab",
    images: [
      {
        url: "https://images.unsplash.com/photo-1581092786450-7efcd4ee7160?w=500",
        alt_text: "Digital multimeter",
        is_uploaded: false
      }
    ],
    tags: ["multimeter", "electronics", "measurement", "lab", "tools"],
    status: "active"
  },
  {
    title: "Chemistry Lab Kit",
    description: "Complete chemistry lab kit with beakers, test tubes, and basic chemicals. Perfect for chemistry students.",
    category: "lab-equipment",
    subcategory: "chemistry",
    condition: "good",
    pricing: {
      type: "rent",
      amount: 35,
      duration: "per month",
      currency: "USD"
    },
    availability: {
      status: "available"
    },
    location: "Chemistry Building",
    images: [
      {
        url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500",
        alt_text: "Chemistry lab equipment",
        is_uploaded: false
      }
    ],
    tags: ["chemistry", "lab", "equipment", "beakers", "science"],
    status: "active"
  },
  {
    title: "DSLR Camera - Canon EOS",
    description: "Professional DSLR camera perfect for photography projects and assignments. Includes 18-55mm lens.",
    category: "electronics",
    subcategory: "cameras",
    condition: "excellent",
    pricing: {
      type: "rent",
      amount: 40,
      duration: "per day",
      currency: "USD"
    },
    availability: {
      status: "available"
    },
    location: "Media Center",
    images: [
      {
        url: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500",
        alt_text: "DSLR camera",
        is_uploaded: false
      }
    ],
    tags: ["camera", "photography", "dslr", "canon", "media"],
    status: "active"
  },
  {
    title: "Wireless Bluetooth Headphones",
    description: "High-quality noise-cancelling headphones. Perfect for studying and music production.",
    category: "electronics",
    subcategory: "audio",
    condition: "like-new",
    pricing: {
      type: "rent",
      amount: 20,
      duration: "per week",
      currency: "USD"
    },
    availability: {
      status: "available"
    },
    location: "Student Center",
    images: [
      {
        url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
        alt_text: "Bluetooth headphones",
        is_uploaded: false
      }
    ],
    tags: ["headphones", "audio", "bluetooth", "music", "study"],
    status: "active"
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find or create a demo user
    let demoUser = await User.findOne({ email: 'demo@sharespace.com' });
    
    if (!demoUser) {
      console.log('Creating demo user...');
      demoUser = new User({
        name: 'Demo User',
        email: 'demo@sharespace.com',
        password: 'hashedpassword', // In real app, this would be properly hashed
        college_id: 'DEMO001',
        is_verified: true,
        reputation: 4.8,
        credits: 100
      });
      await demoUser.save();
      console.log('Demo user created');
    }

    // Check if listings already exist
    const existingListings = await Listing.countDocuments();
    if (existingListings > 0) {
      console.log(`Database already has ${existingListings} listings. Skipping seed.`);
      console.log('To reseed, delete existing listings first.');
      return;
    }

    // Add sample listings
    console.log('Adding sample listings...');
    const listingsWithOwner = sampleListings.map(listing => ({
      ...listing,
      ownerId: demoUser._id
    }));

    const createdListings = await Listing.insertMany(listingsWithOwner);
    console.log(`Successfully created ${createdListings.length} sample listings`);

    // Display created listings
    console.log('\n📋 Created Listings:');
    createdListings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title} - ${listing.category}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the seed function
seedDatabase();