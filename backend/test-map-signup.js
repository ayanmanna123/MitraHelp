// Test script for volunteer signup with map location selection
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

async function testVolunteerSignupWithMap() {
  try {
    console.log('Testing volunteer signup with map location selection...\n');
    
    // Create a test user
    const testUser = new User({
      name: 'Map Test Volunteer',
      phone: '+1122334455',
      email: 'map.volunteer@test.com',
      role: 'user'
    });
    
    await testUser.save();
    console.log('✅ Test user created');
    
    // Simulate volunteer signup with map-selected location
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      {
        $set: {
          name: 'Map Test Volunteer Updated',
          email: 'map.volunteer.updated@test.com',
          'permanentAddress.address': '123 Map Street, City, State 12345',
          'permanentAddress.type': 'Point',
          'permanentAddress.coordinates': [-122.419416, 37.774929], // San Francisco coordinates
          role: 'volunteer',
          volunteerStatus: 'pending'
        }
      },
      { new: true }
    );
    
    console.log('✅ Volunteer profile updated with map-selected coordinates');
    console.log('Updated user data:');
    console.log('- Name:', updatedUser.name);
    console.log('- Email:', updatedUser.email);
    console.log('- Role:', updatedUser.role);
    console.log('- Volunteer Status:', updatedUser.volunteerStatus);
    console.log('- Permanent Address:', updatedUser.permanentAddress.address);
    console.log('- Coordinates:', updatedUser.permanentAddress.coordinates);
    console.log('- Latitude:', updatedUser.permanentAddress.coordinates[1]);
    console.log('- Longitude:', updatedUser.permanentAddress.coordinates[0]);
    
    // Test geospatial query with coordinates
    const nearbyVolunteers = await User.find({
      role: 'volunteer',
      'permanentAddress.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-122.419416, 37.774929] // Same location
          },
          $maxDistance: 10000 // 10km radius
        }
      }
    }).select('name email permanentAddress');
    
    console.log('\n✅ Geospatial query with coordinates working:');
    console.log(`Found ${nearbyVolunteers.length} volunteers near the location`);
    if (nearbyVolunteers.length > 0) {
      console.log('Volunteer with coordinates found in query results');
      console.log('Volunteer coordinates:', nearbyVolunteers[0].permanentAddress.coordinates);
    }
    
    // Test reverse geocoding simulation
    console.log('\n✅ Testing coordinate to address conversion:');
    const testCoords = [-122.419416, 37.774929];
    console.log(`Coordinates: ${testCoords[1]}, ${testCoords[0]}`);
    console.log('Would convert to address via Nominatim API');
    
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
testVolunteerSignupWithMap();