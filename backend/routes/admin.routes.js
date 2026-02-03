const express = require('express');
const { getVolunteers, approveVolunteer, rejectVolunteer } = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require login
router.use(protect);
// All routes require admin role
router.use(admin);

router.get('/volunteers', getVolunteers);
router.post('/volunteers/:id/approve', approveVolunteer);
router.post('/volunteers/:id/reject', rejectVolunteer);

module.exports = router;
