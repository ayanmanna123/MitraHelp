const express = require('express');
const { blockUser, reportUser } = require('../controllers/user.controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/block/:id', protect, blockUser);
router.post('/report', protect, reportUser);

module.exports = router;
