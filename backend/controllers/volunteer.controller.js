const User = require('../models/user.model');

// Helper function to calculate volunteer progress
const calculateVolunteerProgress = (user) => {
    const progress = {
        personalInfoComplete: false,
        documentsUploaded: false,
        verificationPending: false,
        completedSteps: 0,
        totalSteps: 3,
        percentage: 0
    };

    // Check if personal info is complete (require name and at least one contact method)
    if (user.name && (user.phone || user.email)) {
        progress.personalInfoComplete = true;
        progress.completedSteps++;
    }

    // Check if documents are uploaded
    if (user.governmentIdImage && user.selfieImage) {
        progress.documentsUploaded = true;
        progress.completedSteps++;
    }

    // Check verification status
    if (user.volunteerStatus === 'pending') {
        progress.verificationPending = true;
        progress.completedSteps++; // Count as completed since it's submitted
    } else if (user.volunteerStatus === 'approved') {
        progress.verificationPending = true;
        progress.completedSteps++; // Count as completed since approved
    }

    // Calculate percentage
    progress.percentage = Math.round((progress.completedSteps / progress.totalSteps) * 100);
    
    return progress;
};

// @desc    Register as a volunteer (Upload docs)
// @route   POST /api/volunteer/register
// @access  Private (User)
exports.registerVolunteer = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.volunteerStatus === 'pending') {
             return res.status(400).json({ success: false, message: 'Application already pending.' });
        }
        
        if (user.volunteerStatus === 'approved') {
             return res.status(400).json({ success: false, message: 'You are already a volunteer.' });
        }

        console.log('Register Volunteer - req.files:', req.files);
        console.log('Register Volunteer - user before update:', user);

        let hasUpdates = false;

        // Check for uploaded files
        if (req.files) {
            if (req.files.governmentId && req.files.governmentId.length > 0) {
                user.governmentIdImage = req.files.governmentId[0].location || req.files.governmentId[0].path;
                hasUpdates = true;
            }
            if (req.files.selfie && req.files.selfie.length > 0) {
                user.selfieImage = req.files.selfie[0].location || req.files.selfie[0].path;
                hasUpdates = true;
            }
        }

        if (!hasUpdates) {
             return res.status(400).json({ success: false, message: 'No documents uploaded.' });
        }

        // Check if both documents are now present
        if (user.governmentIdImage && user.selfieImage) {
            user.volunteerStatus = 'pending';
            user.role = 'volunteer'; // Update user role to volunteer immediately
            user.rejectionReason = undefined; // Clear previous rejection reason if any
            
            // Update progress tracking
            user.volunteerProgress.documentsUploaded = true;
            user.volunteerProgress.verificationPending = true;
        }

        await user.save();

        // Calculate progress after saving
        const progress = calculateVolunteerProgress(user);

        res.status(200).json({
            success: true,
            message: user.volunteerStatus === 'pending' ? 'Volunteer application submitted successfully' : 'Document uploaded successfully',
            data: {
                volunteerStatus: user.volunteerStatus,
                governmentIdImage: user.governmentIdImage,
                selfieImage: user.selfieImage,
                progress: progress
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get volunteer status
// @route   GET /api/volunteer/status
// @access  Private
exports.getVolunteerStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('volunteerStatus rejectionReason governmentIdImage selfieImage name phone email role volunteerProgress'); 
        
        // Calculate progress
        const progress = calculateVolunteerProgress(user);
        
        res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                progress: progress
            }
        });
    } catch (error) {
         res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get volunteer progress
// @route   GET /api/volunteer/progress
// @access  Private
exports.getVolunteerProgress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('volunteerProgress volunteerStatus name phone email governmentIdImage selfieImage');
        
        // Calculate progress
        const progress = calculateVolunteerProgress(user);
        
        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
