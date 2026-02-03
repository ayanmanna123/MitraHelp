const User = require('../models/user.model');
const Report = require('../models/report.model');

// @desc    Block a user
// @route   PUT /api/users/block/:id
// @access  Private
exports.blockUser = async (req, res) => {
    try {
        const userToBlockId = req.params.id;
        const user = await User.findById(req.user.id);

        if (userToBlockId === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot block yourself' });
        }

        if (!user.blockedUsers.includes(userToBlockId)) {
            user.blockedUsers.push(userToBlockId);
            await user.save();
        }

        res.status(200).json({ success: true, message: 'User blocked successfully', data: user.blockedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Report a user
// @route   POST /api/users/report
// @access  Private
exports.reportUser = async (req, res) => {
    try {
        const { reportedUserId, reason, description, emergencyId } = req.body;

        const report = await Report.create({
            reporter: req.user.id,
            reportedUser: reportedUserId,
            reason,
            description,
            emergencyId
        });

        res.status(201).json({ success: true, message: 'Report submitted successfully', data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
