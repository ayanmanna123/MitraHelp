const User = require('../models/user.model');
const Report = require('../models/report.model');
const axios = require('axios');

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

// @desc    Update user location
// @route   PUT /api/users/location
// @access  Private

exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (lat === 0 && lon === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location coordinates (0,0)'
            });
        }

        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinate range'
            });
        }

        const address = `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    location: {
                        type: 'Point',
                        coordinates: [lon, lat],
                        address
                    }
                }
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            data: updatedUser.location
        });

    } catch (error) {
        console.error('Update location error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }


};

// @desc    Get current location
// @route   GET /api/users/location
// @access  Private
exports.getCurrentLocation = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('location');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user.location
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
