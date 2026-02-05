const express = require('express');
const { 
    getVolunteers, 
    approveVolunteer, 
    rejectVolunteer, 
    getFaceVerifications, 
    updateFaceVerificationStatus, 
    getVolunteersWithDetails,
    getAllUsers,
    blockUser,
    getEmergencyDashboard,
    getAnalytics,
    getSystemConfig,
    updateSystemConfig
} = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require login
router.use(protect);
// All routes require admin role
router.use(admin);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id/block', blockUser);

// Volunteer management routes
router.get('/volunteers', getVolunteers);
router.get('/volunteers/details', getVolunteersWithDetails);
router.post('/volunteers/:id/approve', approveVolunteer);
router.post('/volunteers/:id/reject', rejectVolunteer);

// Face verification management routes
router.get('/face-verifications', getFaceVerifications);
router.put('/face-verification/:id', updateFaceVerificationStatus);

// Emergency monitoring routes
router.get('/emergencies/dashboard', getEmergencyDashboard);

// Analytics and reporting routes
router.get('/analytics', getAnalytics);

// System configuration routes
router.get('/config', getSystemConfig);
router.put('/config', updateSystemConfig);

module.exports = router;
