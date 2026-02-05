const User = require('../models/user.model');
const Emergency = require('../models/emergency.model');

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

// @desc    Get volunteer applications with detailed information including face verification
// @route   GET /api/admin/volunteers/details
// @access  Private (Admin)
exports.getVolunteersWithDetails = async (req, res) => {
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

// @desc    Get all users (for user management)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const { page = 1, limit = 20, search = '', status = 'all', role = 'all' } = req.query;
        
        // Build search filter
        let filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status !== 'all') {
            filter.volunteerStatus = status;
        }
        
        if (role !== 'all') {
            filter.role = role;
        }

        const users = await User.find(filter)
            .select('name phone email role volunteerStatus isAvailable createdAt blockedUsers')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
exports.blockUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const { blocked } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot block admin users' });
        }

        user.isAvailable = !blocked;
        
        await user.save();

        res.status(200).json({
            success: true,
            message: blocked ? 'User blocked successfully' : 'User unblocked successfully',
            data: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get emergency monitoring dashboard data
// @route   GET /api/admin/emergencies/dashboard
// @access  Private (Admin)
exports.getEmergencyDashboard = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const Emergency = require('../models/emergency.model');
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get emergency statistics
        const totalEmergencies = await Emergency.countDocuments();
        const todayEmergencies = await Emergency.countDocuments({ createdAt: { $gte: oneDayAgo } });
        const weekEmergencies = await Emergency.countDocuments({ createdAt: { $gte: oneWeekAgo } });
        const monthEmergencies = await Emergency.countDocuments({ createdAt: { $gte: oneMonthAgo } });

        // Get status breakdown
        const statusBreakdown = await Emergency.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get type breakdown
        const typeBreakdown = await Emergency.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent emergencies (last 10)
        const recentEmergencies = await Emergency.find()
            .populate('requester', 'name phone')
            .populate('assignedVolunteer', 'name phone')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get response time statistics
        const completedEmergencies = await Emergency.find({ 
            status: 'Completed',
            'tracking.statusUpdates': { $exists: true, $ne: [] }
        });

        let avgResponseTime = 0;
        if (completedEmergencies.length > 0) {
            const totalResponseTime = completedEmergencies.reduce((sum, emergency) => {
                const firstUpdate = emergency.tracking?.statusUpdates?.find(update => 
                    update.status === 'Accepted' || update.status === 'On The Way'
                );
                if (firstUpdate) {
                    return sum + (new Date(firstUpdate.timestamp) - new Date(emergency.createdAt));
                }
                return sum;
            }, 0);
            
            avgResponseTime = totalResponseTime / completedEmergencies.length;
        }

        res.status(200).json({
            success: true,
            data: {
                statistics: {
                    totalEmergencies,
                    todayEmergencies,
                    weekEmergencies,
                    monthEmergencies,
                    avgResponseTime: Math.round(avgResponseTime / (1000 * 60)) // in minutes
                },
                statusBreakdown,
                typeBreakdown,
                recentEmergencies
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get system analytics and reports
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        const Emergency = require('../models/emergency.model');
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // User statistics
        const totalUsers = await User.countDocuments();
        const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
        const newUsersToday = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
        const newUsersWeek = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });

        // Volunteer application statistics
        const pendingApplications = await User.countDocuments({ volunteerStatus: 'pending' });
        const approvedApplications = await User.countDocuments({ volunteerStatus: 'approved' });
        const rejectedApplications = await User.countDocuments({ volunteerStatus: 'rejected' });

        // Face verification statistics
        const faceVerificationStats = await User.aggregate([
            {
                $group: {
                    _id: '$faceVerification.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Emergency statistics by time period
        const emergencyStats = {
            today: await Emergency.countDocuments({ createdAt: { $gte: oneDayAgo } }),
            week: await Emergency.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
            month: await Emergency.countDocuments({ createdAt: { $gte: oneMonthAgo } })
        };

        // Emergency type distribution
        const emergencyTypeDistribution = await Emergency.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Response time trends (last 7 days)
        const responseTimeTrends = await Emergency.aggregate([
            {
                $match: {
                    status: 'Completed',
                    createdAt: { $gte: oneWeekAgo },
                    'tracking.statusUpdates': { $exists: true, $ne: [] }
                }
            },
            {
                $project: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    responseTime: {
                        $let: {
                            vars: {
                                firstUpdate: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: '$tracking.statusUpdates',
                                                cond: {
                                                    $in: ['$$this.status', ['Accepted', 'On The Way']]
                                                }
                                            }
                                        },
                                        0
                                    ]
                                }
                            },
                            in: {
                                $divide: [
                                    { $subtract: ['$$firstUpdate.timestamp', '$createdAt'] },
                                    60000 // Convert to minutes
                                ]
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$date',
                    avgResponseTime: { $avg: '$responseTime' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                userStats: {
                    totalUsers,
                    totalVolunteers,
                    newUsersToday,
                    newUsersWeek
                },
                volunteerStats: {
                    pending: pendingApplications,
                    approved: approvedApplications,
                    rejected: rejectedApplications
                },
                faceVerificationStats,
                emergencyStats,
                emergencyTypeDistribution,
                responseTimeTrends
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get system configuration
// @route   GET /api/admin/config
// @access  Private (Admin)
exports.getSystemConfig = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        // Get system configuration from environment or database
        const config = {
            system: {
                name: 'MitraHelp',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                maxEmergencyRadius: 5, // km
                volunteerNotificationRadius: 5 // km
            },
            features: {
                emailNotifications: !!process.env.EMAIL_USER,
                smsVerification: !!process.env.TWILIO_ACCOUNT_SID,
                googleAuth: !!process.env.GOOGLE_CLIENT_ID,
                faceVerification: true
            },
            limits: {
                maxEmergencyContacts: 5,
                maxVolunteerApplications: 1000,
                sessionTimeout: 30 // days
            }
        };

        res.status(200).json({
            success: true,
            data: config
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update system configuration
// @route   PUT /api/admin/config
// @access  Private (Admin)
exports.updateSystemConfig = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        // In a real implementation, you would update configuration in database
        // For now, we'll just return success
        const { config } = req.body;

        res.status(200).json({
            success: true,
            message: 'Configuration updated successfully',
            data: config
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};