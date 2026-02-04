const User = require('../models/user.model');

// @desc    Get all volunteer applications
// @route   GET /api/admin/volunteers
// @access  Private (Admin)
exports.getVolunteers = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const volunteers = await User.find({ 
            role: { $in: ['user', 'volunteer'] },
            $or: [
                { volunteerStatus: { $in: ['pending', 'approved', 'rejected'] }},
                { 'faceVerification.status': { $in: ['pending', 'verified', 'rejected'] }}
            ]
        }).select('name phone email volunteerStatus governmentIdImage selfieImage rejectionReason createdAt faceVerification');

        res.status(200).json({
            success: true,
            data: volunteers
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Approve volunteer application
// @route   POST /api/admin/volunteers/:id/approve
// @access  Private (Admin)
exports.approveVolunteer = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const volunteer = await User.findById(req.params.id);
        
        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer not found' });
        }

        if (volunteer.volunteerStatus === 'approved') {
            return res.status(400).json({ success: false, message: 'Volunteer already approved' });
        }

        // Update volunteer status
        volunteer.volunteerStatus = 'approved';
        volunteer.role = 'volunteer';
        volunteer.rejectionReason = undefined;
        
        await volunteer.save();

        res.status(200).json({
            success: true,
            message: 'Volunteer approved successfully',
            data: volunteer
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Reject volunteer application
// @route   POST /api/admin/volunteers/:id/reject
// @access  Private (Admin)
exports.rejectVolunteer = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }

        const volunteer = await User.findById(req.params.id);
        
        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer not found' });
        }

        if (volunteer.volunteerStatus === 'rejected') {
            return res.status(400).json({ success: false, message: 'Volunteer already rejected' });
        }

        // Update volunteer status
        volunteer.volunteerStatus = 'rejected';
        volunteer.rejectionReason = reason;
        
        await volunteer.save();

        res.status(200).json({
            success: true,
            message: 'Volunteer rejected successfully',
            data: volunteer
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all users with face verification status
// @route   GET /api/admin/face-verifications
// @access  Private (Admin)
exports.getFaceVerifications = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const users = await User.find({ 
            'faceVerification.status': { $ne: 'not_submitted' }
        }).select('name phone email faceVerification createdAt');

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update face verification status
// @route   PUT /api/admin/face-verification/:id
// @access  Private (Admin)
exports.updateFaceVerificationStatus = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const { status, adminNotes } = req.body;
        
        if (!status || !['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Valid status (verified/rejected) is required' });
        }

        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.faceVerification) {
            return res.status(400).json({ success: false, message: 'User has no face verification data' });
        }

        // Update verification status
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
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
