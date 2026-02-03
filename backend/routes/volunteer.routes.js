const express = require('express');
const { registerVolunteer, getVolunteerStatus, getVolunteerProgress } = require('../controllers/volunteer.controller');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', protect, upload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), registerVolunteer);

router.get('/status', protect, getVolunteerStatus);

router.get('/progress', protect, getVolunteerProgress);

module.exports = router;
