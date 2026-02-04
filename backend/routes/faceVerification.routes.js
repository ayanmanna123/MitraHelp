const express = require('express');
const router = express.Router();
const { 
    uploadFaceVerificationImages,
    submitFaceVerificationResult,
    getFaceVerificationStatus,
    adminUpdateFaceVerification,
    processFaceVerification
} = require('../controllers/faceVerification.controller');
const { protect, authorize } = require('../middleware/authMiddleware');
const { faceVerificationUpload } = require('../middleware/uploadMiddleware');

// User routes
router.post('/upload', protect, faceVerificationUpload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), uploadFaceVerificationImages);
router.get('/status', protect, getFaceVerificationStatus);
router.post('/result', protect, submitFaceVerificationResult);
router.post('/process', protect, processFaceVerification); // New endpoint for Python-based verification

// Admin routes
router.put('/admin/update/:userId', protect, authorize('admin'), adminUpdateFaceVerification);

module.exports = router;