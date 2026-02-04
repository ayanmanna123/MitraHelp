const express = require('express');
const { createEmergency, getEmergency, acceptEmergency, updateStatus, getUserEmergencies, getNearbyEmergencies, getAssignedEmergencies, updateVolunteerLocation, updateTrackingStatus, getTrackingData } = require('../controllers/emergency.controller');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createEmergency);
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

module.exports = router;
