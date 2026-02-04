const express = require('express');
const { registerVolunteer, getVolunteerStatus, getVolunteerProgress, registerVolunteerWithFaceVerification } = require('../controllers/volunteer.controller');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', protect, upload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), registerVolunteer);

router.post('/register-with-face-verification', protect, upload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), registerVolunteerWithFaceVerification);

router.get('/status', protect, getVolunteerStatus);

router.get('/progress', protect, getVolunteerProgress);

module.exports = router;
