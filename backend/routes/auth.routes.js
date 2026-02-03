const express = require('express');
const { sendOtp, verifyOtp, getMe, updateProfile, googleLogin } = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/google', googleLogin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
