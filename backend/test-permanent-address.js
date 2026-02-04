// Test script for permanent address functionality
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user.model');

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mitrahelp')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function testPermanentAddress() {
  try {
    console.log('Testing permanent address functionality...\n');
    
    // Create a test user with permanent address
    const testUser = new User({
      name: 'Test User',
      phone: '+1234567890',
      email: 'test@example.com',
      role: 'user',
      permanentAddress: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610], // NYC coordinates
        address: '123 Main Street, New York, NY 10001'
      }
    });
    
    await testUser.save();
    console.log('✅ User created with permanent address');
    console.log('Permanent Address:', testUser.permanentAddress);
    
    // Test geospatial query - find users near a location
    const nearbyUsers = await User.find({
      'permanentAddress.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610] // Same location
          },
          $maxDistance: 1000 // 1km radius
        }
      }
    });
    
    console.log('\n✅ Geospatial query working:');
    console.log(`Found ${nearbyUsers.length} users near the location`);
    if (nearbyUsers.length > 0) {
      console.log('User with permanent address found in query results');
    }
    
    // Test updating permanent address
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      {
        $set: {
          'permanentAddress.address': '456 Updated Street, New York, NY 10001'
        }
      },
      { new: true }
    );
    
    console.log('\n✅ Permanent address update test:');
    console.log('Updated address:', updatedUser.permanentAddress.address);
    
    // Clean up
    await User.findByIdAndDelete(testUser._id);
    console.log('\n✅ Test completed successfully - user cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testPermanentAddress();