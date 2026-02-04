const express = require('express');
const { blockUser, reportUser, updateLocation, getCurrentLocation } = require('../controllers/user.controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/block/:id', protect, blockUser);
router.post('/report', protect, reportUser);
router.put('/location', protect, updateLocation);
router.get('/location', protect, getCurrentLocation);

module.exports = router;
