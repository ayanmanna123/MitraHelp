const User = require('../models/user.model');

// @desc    Get all pending volunteers
// @route   GET /api/admin/pending-volunteers
// @access  Private (Admin)
exports.getPendingVolunteers = async (req, res) => {
    try {
        const volunteers = await User.find({ volunteerStatus: 'pending' }).select('name phone governmentIdImage selfieImage createdAt');
        res.status(200).json({
            success: true,
            count: volunteers.length,
            data: volunteers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Approve volunteer
// @route   PUT /api/admin/approve-volunteer/:id
// @access  Private (Admin)
exports.approveVolunteer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.volunteerStatus !== 'pending') {
            return res.status(400).json({ success: false, message: `User status is ${user.volunteerStatus}, must be pending` });
        }

        user.volunteerStatus = 'approved';
        user.role = 'volunteer'; // Upgrade role
        user.isVerified = true; // Ensure they are marked verified
        
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Volunteer approved successfully',
            data: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Reject volunteer
// @route   PUT /api/admin/reject-volunteer/:id
// @access  Private (Admin)
exports.rejectVolunteer = async (req, res) => {
    try {
         const { reason } = req.body;
         const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

         if (user.volunteerStatus !== 'pending') {
            return res.status(400).json({ success: false, message: `User status is ${user.volunteerStatus}, must be pending` });
        }

        user.volunteerStatus = 'rejected';
        user.rejectionReason = reason || 'Documents did not match requirements';
        // Note: We don't change the role, they remain 'user'
        
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Volunteer application rejected',
            data: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
