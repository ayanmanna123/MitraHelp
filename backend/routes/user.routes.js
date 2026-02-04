const express = require('express');
const { blockUser, reportUser, updateLocation, getCurrentLocation, getProfile, updateProfile, addEmergencyContact, deleteEmergencyContact } = require('../controllers/user.controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/block/:id', protect, blockUser);
router.post('/report', protect, reportUser);
router.put('/location', protect, updateLocation);
router.get('/location', protect, getCurrentLocation);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/emergency-contacts', protect, addEmergencyContact);
router.delete('/emergency-contacts/:contactId', protect, deleteEmergencyContact);

module.exports = router;
