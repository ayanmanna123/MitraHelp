// Test script for dual-location emergency notifications
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Emergency = require('./models/emergency.model');

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mitrahelp')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function testDualLocationNotifications() {
  try {
    console.log('Testing dual-location emergency notifications...\n');
    
    // Create test volunteers with different location configurations
    const volunteers = [
      // Volunteer with current location only (5km from emergency)
      new User({
        name: 'Current Location Volunteer',
        phone: '+1111111111',
        email: 'current.volunteer@test.com',
        role: 'volunteer',
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-73.935242, 40.730610], // 5km from emergency
          address: 'Current Location Address'
        }
      }),
      
      // Volunteer with permanent address only (10km from emergency)
      new User({
        name: 'Permanent Address Volunteer',
        phone: '+2222222222',
        email: 'permanent.volunteer@test.com',
        role: 'volunteer',
        isAvailable: true,
        permanentAddress: {
          type: 'Point',
          coordinates: [-73.900000, 40.700000], // 10km from emergency
          address: 'Permanent Address, City, State'
        }
      }),
      
      // Volunteer with both locations (3km from emergency by current, 12km by permanent)
      new User({
        name: 'Both Locations Volunteer',
        phone: '+3333333333',
        email: 'both.volunteer@test.com',
        role: 'volunteer',
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-73.950000, 40.740000], // 3km from emergency
          address: 'Current Location'
        },
        permanentAddress: {
          type: 'Point',
          coordinates: [-73.880000, 40.680000], // 12km from emergency
          address: 'Permanent Address'
        }
      })
    ];
    
    // Save volunteers
    await Promise.all(volunteers.map(vol => vol.save()));
    console.log(`✅ Created ${volunteers.length} test volunteers`);
    
    // Create test emergency (at central location)
    const emergency = new Emergency({
      requester: volunteers[0]._id, // Use first volunteer as requester
      type: 'Medical',
      description: 'Test emergency for dual-location notifications',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610], // Central location
        address: 'Emergency Location, City, State'
      },
      status: 'Searching'
    });
    
    await emergency.save();
    console.log('✅ Created test emergency');
    
    // Test geospatial queries
    console.log('\n🔍 Testing location-based volunteer discovery...');
    
    // Find by current location (5km radius)
    const nearbyVolunteers = await User.find({
      role: 'volunteer',
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: emergency.location.coordinates
          },
          $maxDistance: 5000 // 5km
        }
      }
    }).select('name location.coordinates');
    
    console.log(`Found ${nearbyVolunteers.length} volunteers by current location:`);
    nearbyVolunteers.forEach(vol => {
      console.log(`  - ${vol.name} (${vol.location.coordinates[1].toFixed(4)}, ${vol.location.coordinates[0].toFixed(4)})`);
    });
    
    // Find by permanent address (15km radius)
    const permanentAddressVolunteers = await User.find({
      role: 'volunteer',
      isAvailable: true,
      'permanentAddress.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: emergency.location.coordinates
          },
          $maxDistance: 15000 // 15km
        }
      }
    }).select('name permanentAddress.coordinates');
    
    console.log(`\nFound ${permanentAddressVolunteers.length} volunteers by permanent address:`);
    permanentAddressVolunteers.forEach(vol => {
      if (vol.permanentAddress && vol.permanentAddress.coordinates) {
        console.log(`  - ${vol.name} (${vol.permanentAddress.coordinates[1].toFixed(4)}, ${vol.permanentAddress.coordinates[0].toFixed(4)})`);
      }
    });
    
    // Test deduplication logic
    const allVolunteerIds = new Set();
    const allVolunteers = [...nearbyVolunteers];
    
    nearbyVolunteers.forEach(vol => allVolunteerIds.add(vol._id.toString()));
    permanentAddressVolunteers.forEach(vol => {
      if (!allVolunteerIds.has(vol._id.toString())) {
        allVolunteers.push(vol);
      }
    });
    
    console.log(`\n📊 Combined results:`);
    console.log(`- Total unique volunteers: ${allVolunteers.length}`);
    console.log(`- Found by current location: ${nearbyVolunteers.length}`);
    console.log(`- Found by permanent address: ${permanentAddressVolunteers.length}`);
    
    // Clean up
    await Promise.all([
      ...volunteers.map(vol => User.findByIdAndDelete(vol._id)),
      Emergency.findByIdAndDelete(emergency._id)
    ]);
    console.log('\n✅ Test completed successfully - data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testDualLocationNotifications();