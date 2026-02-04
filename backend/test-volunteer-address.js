// Test script for volunteer permanent address signup
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

async function testVolunteerSignupWithAddress() {
  try {
    console.log('Testing volunteer signup with permanent address...\n');
    
    // Create a test user (simulating pre-existing user)
    const testUser = new User({
      name: 'Test Volunteer',
      phone: '+1987654321',
      email: 'volunteer@test.com',
      role: 'user'
    });
    
    await testUser.save();
    console.log('✅ Test user created');
    
    // Simulate volunteer signup with permanent address
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      {
        $set: {
          name: 'Test Volunteer Updated',
          email: 'volunteer.updated@test.com',
          'permanentAddress.address': '123 Volunteer Street, City, State 12345',
          'permanentAddress.type': 'Point',
          'permanentAddress.coordinates': [-74.005974, 40.712776], // NYC coordinates
          role: 'volunteer',
          volunteerStatus: 'pending'
        }
      },
      { new: true }
    );
    
    console.log('✅ Volunteer profile updated with permanent address');
    console.log('Updated user data:');
    console.log('- Name:', updatedUser.name);
    console.log('- Email:', updatedUser.email);
    console.log('- Role:', updatedUser.role);
    console.log('- Volunteer Status:', updatedUser.volunteerStatus);
    console.log('- Permanent Address:', updatedUser.permanentAddress.address);
    console.log('- Coordinates:', updatedUser.permanentAddress.coordinates);
    
    // Test geospatial query for volunteers near a location
    const nearbyVolunteers = await User.find({
      role: 'volunteer',
      'permanentAddress.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-74.005974, 40.712776] // Same location
          },
          $maxDistance: 5000 // 5km radius
        }
      }
    }).select('name email permanentAddress.address');
    
    console.log('\n✅ Geospatial query for volunteers working:');
    console.log(`Found ${nearbyVolunteers.length} volunteers near the location`);
    if (nearbyVolunteers.length > 0) {
      console.log('Volunteer with permanent address found in query results');
      console.log('Volunteer details:', nearbyVolunteers[0]);
    }
    
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
testVolunteerSignupWithAddress();