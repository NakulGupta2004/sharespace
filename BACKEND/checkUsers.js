require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'sharespace'
    });
    
    console.log('Connected to MongoDB');
    
    const users = await User.find({}).select('name email college_id verified createdAt');
    console.log('Users in database:', users.length);
    
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Verified: ${user.verified}`);
    });
    
    // Check for the specific email
    const sarthakUser = await User.findOne({ email: 'sarthak@ggg.edu' });
    if (sarthakUser) {
      console.log('\nSarthak user found:', {
        email: sarthakUser.email,
        name: sarthakUser.name,
        verified: sarthakUser.verified,
        hasPassword: !!sarthakUser.password
      });
    } else {
      console.log('\nSarthak user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();