const Emergency = require('../models/emergency.model');
const User = require('../models/user.model');

// @desc    Create new emergency request & Notify volunteers
// @route   POST /api/emergency
// @access  Private (User)
exports.createEmergency = async (req, res) => {
    try {
        const { type, description, latitude, longitude, address } = req.body;
        
        console.log('Emergency request body:', req.body);
        console.log('User ID:', req.user.id);

        if (!latitude || !longitude) {
            return res.status(400).json({ 
                success: false, 
                message: 'Location is required',
                received: { latitude, longitude }
            });
        }

        // Validate latitude and longitude
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid latitude or longitude values',
                received: { latitude, longitude }
            });
        }

        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return res.status(400).json({ 
                success: false, 
                message: 'Latitude must be between -90 and 90, longitude between -180 and 180',
                received: { latitude: lat, longitude: lon }
            });
        }

        // Validate emergency type
        const validTypes = ['Medical', 'Accident', 'Blood', 'Disaster', 'Other'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid emergency type',
                validTypes
            });
        }

        // Create Emergency
        const emergency = await Emergency.create({
            requester: req.user.id,
            type,
            description: description || `Emergency request for ${type}`,
            location: {
                type: 'Point',
                coordinates: [lon, lat],
                address: address || `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`
            },
            status: 'Searching'
        });

        console.log('Emergency created successfully:', emergency._id);

        // Find nearby volunteers (within 5km for example)
        // Note: In production, radius should be dynamic or larger
        const radiusInKm = 5;
        const nearbyVolunteers = await User.find({
            role: 'volunteer',
            isAvailable: true,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: radiusInKm * 1000 // meters
                }
            }
        });

        // Add them to notified list (async update)
        const volunteerIds = nearbyVolunteers.map(v => v._id);
        emergency.volunteersNotified = volunteerIds;
        await emergency.save();

        // Emit Socket Event to Volunteers
        const io = req.app.get('socketio');
        if (io) {
            volunteerIds.forEach(volId => {
                io.to(volId.toString()).emit('new_emergency', {
                    emergencyId: emergency._id,
                    type: emergency.type,
                    location: emergency.location,
                    requester: req.user.name
                });
            });
        }

        res.status(201).json({
            success: true,
            data: emergency,
            volunteersFound: nearbyVolunteers.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get emergency details
// @route   GET /api/emergency/:id
// @access  Private
exports.getEmergency = async (req, res) => {
    try {
        const emergency = await Emergency.findById(req.params.id)
            .populate('requester', 'name phone location')
            .populate('assignedVolunteer', 'name phone location');

        if (!emergency) {
            return res.status(404).json({ success: false, message: 'Emergency not found' });
        }

        res.status(200).json({ success: true, data: emergency });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Volunteer accepts emergency
// @route   PUT /api/emergency/:id/accept
// @access  Private (Volunteer)
exports.acceptEmergency = async (req, res) => {
    try {
        const emergency = await Emergency.findById(req.params.id);

        if (!emergency) {
            return res.status(404).json({ success: false, message: 'Emergency not found' });
        }

        if (emergency.status !== 'Searching') {
            return res.status(400).json({ success: false, message: 'Emergency already accepted or completed' });
        }

        emergency.assignedVolunteer = req.user.id;
        emergency.status = 'Accepted';
        await emergency.save();

        // Notify Requester
        const io = req.app.get('socketio');
        if (io) {
            io.to(emergency.requester.toString()).emit('emergency_accepted', {
                emergencyId: emergency._id,
                volunteer: req.user.name,
                volunteerPhone: req.user.phone,
                volunteerLocation: req.user.location
            });
        }

        res.status(200).json({ success: true, data: emergency });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all emergencies for a user
// @route   GET /api/emergency/user
// @access  Private
exports.getUserEmergencies = async (req, res) => {
    try {
        const emergencies = await Emergency.find({ requester: req.user.id })
            .populate('assignedVolunteer', 'name phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: emergencies
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update emergency status (e.g., Completed)
// @route   PUT /api/emergency/:id/status
// @access  Private
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const emergency = await Emergency.findById(req.params.id);

        if (!emergency) {
            return res.status(404).json({ success: false, message: 'Emergency not found' });
        }

        // Only requester or assigned volunteer can update
        if (emergency.requester.toString() !== req.user.id && 
            emergency.assignedVolunteer?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        emergency.status = status;
        await emergency.save();

        // Notify other party
        const io = req.app.get('socketio');
        if (io) {
            const recipient = emergency.requester.toString() === req.user.id 
                ? emergency.assignedVolunteer?.toString() 
                : emergency.requester.toString();
            
            if (recipient) {
                io.to(recipient).emit('status_update', {
                    emergencyId: emergency._id,
                    status
                });
            }
        }

        res.status(200).json({ success: true, data: emergency });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
