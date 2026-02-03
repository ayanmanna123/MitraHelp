const express = require('express');
const { getPendingVolunteers, approveVolunteer, rejectVolunteer } = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require login
router.use(protect);
// All routes require admin role
router.use(admin);

router.get('/pending-volunteers', getPendingVolunteers);
router.put('/approve-volunteer/:id', approveVolunteer);
router.put('/reject-volunteer/:id', rejectVolunteer);

module.exports = router;
