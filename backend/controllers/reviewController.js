const Review = require('../models/review.model');
const Emergency = require('../models/emergency.model');
const User = require('../models/user.model');

// @desc    Submit a review for a volunteer after completing a rescue
// @route   POST /api/emergency/:id/review
// @access  Private
exports.submitReview = async (req, res) => {
    try {
        const { rating, comment, anonymous } = req.body;
        const emergencyId = req.params.id;

        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating is required and must be between 1 and 5'
            });
        }

        if (comment && comment.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be less than 500 characters'
            });
        }

        // Find the emergency
        const emergency = await Emergency.findById(emergencyId)
            .populate('requester assignedVolunteer');

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency not found'
            });
        }

        // Check if the user is the requester of this emergency
        if (emergency.requester._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the requester can submit a review for this emergency'
            });
        }

        // Check if the emergency is completed
        if (emergency.status !== 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Review can only be submitted for completed emergencies'
            });
        }

        // Check if a review already exists for this requester and emergency
        const existingReview = await Review.findOne({
            requester: req.user.id,
            emergency: emergencyId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a review for this emergency'
            });
        }

        // Create the review
        const review = await Review.create({
            requester: req.user.id,
            volunteer: emergency.assignedVolunteer,
            emergency: emergencyId,
            rating,
            comment,
            anonymous: Boolean(anonymous)
        });

        // Add the review to the emergency
        emergency.reviews.push(review._id);
        await emergency.save();

        // Update volunteer's average rating
        if (emergency.assignedVolunteer) {
            await updateVolunteerAverageRating(emergency.assignedVolunteer);
        }

        res.status(201).json({
            success: true,
            data: review,
            message: 'Review submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get all reviews for a specific volunteer
// @route   GET /api/emergency/reviews/volunteer/:volunteerId
// @access  Private
exports.getReviewsForVolunteer = async (req, res) => {
    try {
        const volunteerId = req.params.volunteerId;

        // Check if the volunteer exists
        const volunteer = await User.findById(volunteerId);
        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        // Get reviews for the volunteer
        const reviews = await Review.find({ volunteer: volunteerId })
            .populate({
                path: 'requester',
                select: 'name profilePicture'
            })
            .populate({
                path: 'emergency',
                select: 'type description createdAt'
            })
            .sort({ createdAt: -1 }); // Most recent first

        // Calculate average rating
        let averageRating = 0;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = totalRating / reviews.length;
        }

        res.status(200).json({
            success: true,
            data: {
                reviews,
                averageRating: parseFloat(averageRating.toFixed(2)),
                totalReviews: reviews.length
            }
        });

    } catch (error) {
        console.error('Error getting reviews for volunteer:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get all reviews submitted by the current user
// @route   GET /api/emergency/reviews/my-reviews
// @access  Private
exports.getReviewsByRequester = async (req, res) => {
    try {
        const reviews = await Review.find({ requester: req.user.id })
            .populate({
                path: 'volunteer',
                select: 'name profilePicture'
            })
            .populate({
                path: 'emergency',
                select: 'type description createdAt'
            })
            .sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            data: reviews
        });

    } catch (error) {
        console.error('Error getting reviews by requester:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Helper function to update volunteer's average rating
async function updateVolunteerAverageRating(volunteerId) {
    try {
        const reviews = await Review.find({ volunteer: volunteerId });
        
        if (reviews.length === 0) {
            // If no reviews, set average rating to 0
            await User.findByIdAndUpdate(volunteerId, {
                $set: { averageRating: 0, totalReviews: 0 }
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await User.findByIdAndUpdate(volunteerId, {
            $set: { 
                averageRating: parseFloat(averageRating.toFixed(2)), 
                totalReviews: reviews.length 
            }
        });
    } catch (error) {
        console.error('Error updating volunteer average rating:', error);
    }
}