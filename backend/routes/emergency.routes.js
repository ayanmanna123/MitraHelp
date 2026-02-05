const express = require('express');
const uploadEmergencyImages = require('../middleware/uploadEmergencyImages');
const { createEmergency, getEmergency, acceptEmergency, updateStatus, getUserEmergencies, getNearbyEmergencies, getAssignedEmergencies, updateVolunteerLocation, updateTrackingStatus, getTrackingData } = require('../controllers/emergency.controller');
const { submitReview, getReviewsForVolunteer, getReviewsByRequester } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, uploadEmergencyImages.array('images', 5), createEmergency);
router.get('/nearby', protect, getNearbyEmergencies);
router.get('/assigned', protect, getAssignedEmergencies);
router.get('/user', protect, getUserEmergencies);
router.get('/:id', protect, getEmergency);
router.put('/:id/accept', protect, authorize('volunteer'), acceptEmergency);
router.put('/:id/status', protect, updateStatus);

// Tracking endpoints
router.post('/:id/location', protect, updateVolunteerLocation);
router.post('/:id/tracking-status', protect, updateTrackingStatus);
router.get('/:id/tracking', protect, getTrackingData);

// Review endpoints
router.post('/:id/review', protect, submitReview);
router.get('/reviews/volunteer/:volunteerId', protect, getReviewsForVolunteer);
router.get('/reviews/my-reviews', protect, getReviewsByRequester);

module.exports = router;
