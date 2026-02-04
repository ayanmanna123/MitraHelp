const express = require('express');
const { createEmergency, getEmergency, acceptEmergency, updateStatus, getUserEmergencies, getNearbyEmergencies, getAssignedEmergencies } = require('../controllers/emergency.controller');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createEmergency);
router.get('/nearby', protect, getNearbyEmergencies);
router.get('/assigned', protect, getAssignedEmergencies); // Add this
router.get('/user', protect, getUserEmergencies);
router.get('/:id', protect, getEmergency);
router.put('/:id/accept', protect, authorize('volunteer'), acceptEmergency);
router.put('/:id/status', protect, updateStatus);

module.exports = router;
