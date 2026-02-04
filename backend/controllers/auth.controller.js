const User = require('../models/user.model');
const Otp = require('../models/otp.model');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// @desc    Google Login/Signup
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Google ID Token is required' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, picture, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ 
            $or: [{ googleId }, { email }]
        });

        let isNewUser = false;

        if (user) {
            // Update existing user with googleId if missing (linking accounts)
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user, explicitly set phone to undefined to avoid unique index collision on null
            user = await User.create({
                name,
                email,
                googleId,
                profilePicture: picture,
                isVerified: true, // Google emails are verified
                role: 'user',
                phone: undefined // Explicitly undefined for sparse index
            });
            isNewUser = true;
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Google login successful',
            token,
            user,
            isNewUser
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        console.error("Error Details:", JSON.stringify(error, null, 2)); // Log full error object
        res.status(401).json({ 
            success: false, 
            message: 'Invalid Google Token', 
            error: error.message,
            details: error // Send details to frontend for easier debugging
        });
    }
};

// @desc    Verify OTP and Login/Register
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp, role = 'user' } = req.body; // Default to 'user' if not provided

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
            // Register new user with selected role
            user = await User.create({
                phone,
                role: role, // Set the selected role
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

    // Check if personal info is complete
    if (user.name && user.phone && user.email) {
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

// @desc    Update user profile (Name, Location, Role)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, role, latitude, longitude, isAvailable, bloodGroup, fcmToken } = req.body;

        const user = await User.findById(req.user.id);

        let profileChanged = false;
        
        if (name) {
            user.name = name;
            profileChanged = true;
        }
        if (role) user.role = role;
        if (bloodGroup) user.bloodGroup = bloodGroup;
        if (fcmToken) user.fcmToken = fcmToken;
        
        if (isAvailable !== undefined) user.isAvailable = isAvailable;

        if (latitude && longitude) {
            user.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
            profileChanged = true;
        }

        // If profile info was updated and user is a volunteer, update progress
        if (profileChanged && (user.role === 'volunteer' || user.role === 'user')) {
            const progress = calculateVolunteerProgress(user);
            if (progress.personalInfoComplete) {
                user.volunteerProgress.personalInfoComplete = true;
            }
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
