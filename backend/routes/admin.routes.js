const express = require('express');
const { getVolunteers, approveVolunteer, rejectVolunteer, getFaceVerifications, updateFaceVerificationStatus, getVolunteersWithDetails } = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require login
router.use(protect);
// All routes require admin role
router.use(admin);

router.get('/volunteers', getVolunteers);
router.get('/volunteers/details', getVolunteersWithDetails);
router.post('/volunteers/:id/approve', approveVolunteer);
router.post('/volunteers/:id/reject', rejectVolunteer);

// Face verification management routes
router.get('/face-verifications', getFaceVerifications);
router.put('/face-verification/:id', updateFaceVerificationStatus);

module.exports = router;
