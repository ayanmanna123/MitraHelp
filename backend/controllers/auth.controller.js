const User = require('../models/user.model');
const Otp = require('../models/otp.model');
const generateToken = require('../utils/generateToken');

// @desc    Send OTP to phone
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB (with TTL)
        await Otp.create({ phone, otp });

        // TODO: Integrate SMS Gateway (Twilio/MSG91) here to send actual SMS
        // For development, we send OTP in response
        
        console.log(`Generated OTP for ${phone}: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: { 
                phone,
                otp: process.env.NODE_ENV === 'development' ? otp : undefined 
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Verify OTP and Login/Register
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }

        // Find OTP
        const otpRecord = await Otp.findOne({ phone, otp });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // OTP Valid - Clean up
        await Otp.deleteMany({ phone }); // Remove all OTPs for this phone

        // Check if user exists
        let user = await User.findOne({ phone });
        let isNewUser = false;

        if (!user) {
            // Register new user
            user = await User.create({
                phone,
                isVerified: true
            });
            isNewUser = true;
        }

        // Generate Token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: isNewUser ? 'User registered successfully' : 'Login successful',
            token,
            user,
            isNewUser
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update user profile (Name, Location, Role)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, role, latitude, longitude, isAvailable, bloodGroup, fcmToken } = req.body;

        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (role) user.role = role;
        if (bloodGroup) user.bloodGroup = bloodGroup;
        if (fcmToken) user.fcmToken = fcmToken;
        
        if (isAvailable !== undefined) user.isAvailable = isAvailable;

        if (latitude && longitude) {
            user.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
