const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./backend/models/user.model');
const Emergency = require('./backend/models/emergency.model');
const Review = require('./backend/models/review.model');

async function testReviewSystem() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mitrahelp');
        console.log('Connected to MongoDB');

        // Clear any existing test data
        await Review.deleteMany({ comment: { $regex: 'Test Review', $options: 'i' } });
        console.log('Cleared existing test reviews');

        // Create test users
        let requester = await User.findOne({ email: 'test-requester@example.com' });
        if (!requester) {
            requester = await User.create({
                name: 'Test Requester',
                email: 'test-requester@example.com',
                phone: '+12345678901',
                role: 'user'
            });
            console.log('Created test requester:', requester.name);
        } else {
            console.log('Found existing test requester:', requester.name);
        }

        let volunteer = await User.findOne({ email: 'test-volunteer@example.com' });
        if (!volunteer) {
            volunteer = await User.create({
                name: 'Test Volunteer',
                email: 'test-volunteer@example.com',
                phone: '+12345678902',
                role: 'volunteer',
                isVerified: true
            });
            console.log('Created test volunteer:', volunteer.name);
        } else {
            console.log('Found existing test volunteer:', volunteer.name);
        }

        // Create a test emergency
        const emergency = await Emergency.create({
            requester: requester._id,
            type: 'Medical',
            description: 'Test emergency for review system',
            location: {
                type: 'Point',
                coordinates: [-74.0059, 40.7128], // NYC coordinates
                address: 'Test Address, New York, NY'
            },
            status: 'Completed',
            assignedVolunteer: volunteer._id
        });
        console.log('Created test emergency:', emergency._id);

        // Create a test review
        const review = await Review.create({
            requester: requester._id,
            volunteer: volunteer._id,
            emergency: emergency._id,
            rating: 5,
            comment: 'Test Review: Excellent service! Very helpful and professional.',
            anonymous: false
        });
        console.log('Created test review:', review._id);

        // Update emergency to include the review
        emergency.reviews.push(review._id);
        await emergency.save();

        // Update volunteer's average rating
        const reviews = await Review.find({ volunteer: volunteer._id });
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / reviews.length;
            
            volunteer.averageRating = parseFloat(averageRating.toFixed(2));
            volunteer.totalReviews = reviews.length;
            await volunteer.save();
        }

        // Test fetching reviews for volunteer
        const volunteerReviews = await Review.find({ volunteer: volunteer._id })
            .populate('requester', 'name')
            .populate('emergency', 'type description');
        
        console.log('\n--- Test Results ---');
        console.log('Volunteer Average Rating:', volunteer.averageRating);
        console.log('Volunteer Total Reviews:', volunteer.totalReviews);
        console.log('Reviews for Volunteer:');
        volunteerReviews.forEach(r => {
            console.log(`  - Rating: ${r.rating}, Comment: "${r.comment}", By: ${r.requester.name}`);
        });

        // Test fetching a specific emergency with reviews
        const emergencyWithReviews = await Emergency.findById(emergency._id)
            .populate('requester', 'name')
            .populate('assignedVolunteer', 'name')
            .populate('reviews');
        
        console.log('\nEmergency reviews:');
        emergencyWithReviews.reviews.forEach(r => {
            console.log(`  - Review ID: ${r._id}, Rating: ${r.rating}`);
        });

        console.log('\n✅ Review system test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run the test
testReviewSystem();