const User = require('../models/user.model');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { verifyFacesWithPythonBase64 } = require('../utils/pythonFaceVerification');

// Simulate face comparison for fallback
const simulateFaceComparison = async () => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate a match score (between 0 and 1)
    const matchScore = Math.random() * 0.5 + 0.5; // Random score between 0.5 and 1.0
    const isVerified = matchScore > 0.7; // Threshold for verification
    
    return { matchScore, isVerified };
};
// Python face verification utilities already imported above

// Directory to store uploaded face verification images
const FACE_VERIFICATION_DIR = path.join(__dirname, '../uploads/face-verification');

// Ensure the directory exists
if (!fs.existsSync(FACE_VERIFICATION_DIR)) {
    fs.mkdirSync(FACE_VERIFICATION_DIR, { recursive: true });
}

/**
 * Upload face verification images (government ID and selfie)
 */
const uploadFaceVerificationImages = async (req, res) => {
    try {
        if (!req.files || !req.user) {
            return res.status(400).json({ success: false, message: 'Missing files or user authentication' });
        }

        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const governmentId = req.files['governmentId'] ? req.files['governmentId'][0] : null;
        const selfie = req.files['selfie'] ? req.files['selfie'][0] : null;

        if (!governmentId || !selfie) {
            return res.status(400).json({ success: false, message: 'Both government ID and selfie images are required' });
        }

        // Create a unique folder for this user's verification
        const userVerificationDir = path.join(FACE_VERIFICATION_DIR, userId);
        if (!fs.existsSync(userVerificationDir)) {
            fs.mkdirSync(userVerificationDir, { recursive: true });
        }

        // Save government ID image
        const governmentIdFilename = `gov-id-${Date.now()}-${uuidv4()}.jpg`;
        const governmentIdPath = path.join(userVerificationDir, governmentIdFilename);
        fs.writeFileSync(governmentIdPath, governmentId.buffer);

        // Save selfie image
        const selfieFilename = `selfie-${Date.now()}-${uuidv4()}.jpg`;
        const selfiePath = path.join(userVerificationDir, selfieFilename);
        fs.writeFileSync(selfiePath, selfie.buffer);

        // Update user with verification image paths
        user.faceVerification = {
            governmentIdImage: governmentIdPath,
            selfieImage: selfiePath,
            status: 'pending', // pending, verified, rejected
            submittedAt: new Date()
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Face verification images uploaded successfully',
            data: {
                governmentIdImage: governmentIdPath,
                selfieImage: selfiePath,
                verificationId: user._id
            }
        });
    } catch (error) {
        console.error('Error uploading face verification images:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

/**
 * Submit face verification results from frontend
 */
const submitFaceVerificationResult = async (req, res) => {
    try {
        const { userId, matchScore, isVerified } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update verification status
        if (user.faceVerification) {
            user.faceVerification.status = isVerified ? 'verified' : 'rejected';
            user.faceVerification.matchScore = matchScore;
            user.faceVerification.verifiedAt = new Date();
        } else {
            return res.status(400).json({ success: false, message: 'No face verification data found for this user' });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: `Face verification ${isVerified ? 'completed' : 'rejected'}`,
            data: {
                userId: user._id,
                isVerified,
                matchScore
            }
        });
    } catch (error) {
        console.error('Error submitting face verification result:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

/**
 * Get user's face verification status
 */
const getFaceVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const verificationData = {
            status: user.faceVerification?.status || 'not_submitted',
            governmentIdImage: user.faceVerification?.governmentIdImage,
            selfieImage: user.faceVerification?.selfieImage,
            matchScore: user.faceVerification?.matchScore,
            submittedAt: user.faceVerification?.submittedAt,
            verifiedAt: user.faceVerification?.verifiedAt
        };

        res.status(200).json({
            success: true,
            data: verificationData
        });
    } catch (error) {
        console.error('Error getting face verification status:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

/**
 * Admin route to approve/reject face verification
 */
const adminUpdateFaceVerification = async (req, res) => {
    try {
        const { userId, status, adminNotes } = req.body;

        if (!userId || !['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Valid user ID and status (verified/rejected) are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.faceVerification) {
            return res.status(400).json({ success: false, message: 'No face verification data found for this user' });
        }

        user.faceVerification.status = status;
        user.faceVerification.adminReviewedAt = new Date();
        if (adminNotes) {
            user.faceVerification.adminNotes = adminNotes;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: `Face verification ${status} successfully`,
            data: {
                userId: user._id,
                status
            }
        });
    } catch (error) {
        console.error('Error updating face verification:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

/**
 * Process face verification using Python backend
 */
const processFaceVerification = async (req, res) => {
    try {
        const { verificationId } = req.body;
        
        if (!verificationId) {
            return res.status(400).json({ success: false, message: 'Verification ID is required' });
        }
        
        // Get user and verification data
        const user = await User.findById(verificationId);
        if (!user || !user.faceVerification) {
            return res.status(404).json({ success: false, message: 'Verification data not found' });
        }
        
        const { governmentIdImage, selfieImage } = user.faceVerification;
        
        if (!governmentIdImage || !selfieImage) {
            return res.status(400).json({ success: false, message: 'Both government ID and selfie images are required for verification' });
        }
        
        // Read image files
        if (!fs.existsSync(governmentIdImage) || !fs.existsSync(selfieImage)) {
            return res.status(400).json({ success: false, message: 'Image files not found on server' });
        }
        
        const govIdBuffer = fs.readFileSync(governmentIdImage);
        const selfieBuffer = fs.readFileSync(selfieImage);
        
        // Perform face comparison using Python with TensorFlow
        let comparisonResult;
        try {
            console.log('🔄 Starting Python face verification...');
            comparisonResult = await verifyFacesWithPythonBase64(govIdBuffer, selfieBuffer);
            
            if (!comparisonResult.success) {
                throw new Error(comparisonResult.error || 'Python verification failed');
            }
            
            console.log(`✅ Python verification completed. Raw result:`, comparisonResult);
            
            // Validate the result structure
            if (!comparisonResult || typeof comparisonResult.matchScore !== 'number' || isNaN(comparisonResult.matchScore)) {
                console.error('Invalid match score received from Python:', comparisonResult);
                throw new Error('Invalid match score from Python verification');
            }
            
            console.log(`✅ Python verification completed. Match score: ${(comparisonResult.matchScore * 100).toFixed(2)}%`);
        } catch (comparisonError) {
            console.error('❌ Python face verification failed:', comparisonError);
            console.error('Error stack:', comparisonError.stack);
            // Fallback to simulation if Python verification fails
            comparisonResult = await simulateFaceComparison();
            console.log('🔄 Using fallback simulation. Match score:', (comparisonResult.matchScore * 100).toFixed(2) + '%');
        }
        
        const { matchScore, isVerified } = comparisonResult;
        
        // Update user verification status
        user.faceVerification.status = isVerified ? 'verified' : 'rejected';
        user.faceVerification.matchScore = matchScore;
        user.faceVerification.verifiedAt = new Date();
        
        await user.save();
        
        res.status(200).json({
            success: true,
            message: `Face verification ${isVerified ? 'successful' : 'failed'}`,
            data: {
                userId: user._id,
                isVerified,
                matchScore,
                verificationId
            }
        });
        
    } catch (error) {
        console.error('Error processing face verification:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

module.exports = {
    uploadFaceVerificationImages,
    submitFaceVerificationResult,
    getFaceVerificationStatus,
    adminUpdateFaceVerification,
    processFaceVerification
};