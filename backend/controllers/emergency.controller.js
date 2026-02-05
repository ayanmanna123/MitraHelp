const Emergency = require('../models/emergency.model');
const User = require('../models/user.model');
const { sendEmergencyNotifications } = require('../utils/emailService');

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

        // Find volunteers by current location (within 5km)
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
        }).select('name email location permanentAddress');

        // Find volunteers by permanent address (within 15km for broader coverage)
        const permanentAddressRadiusKm = 15;
        const permanentAddressVolunteers = await User.find({
            role: 'volunteer',
            isAvailable: true,
            'permanentAddress.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: permanentAddressRadiusKm * 1000 // meters
                }
            }
        }).select('name email location permanentAddress');

        // Combine and deduplicate volunteers
        const allVolunteers = [...nearbyVolunteers];
        const nearbyVolunteerIds = new Set(nearbyVolunteers.map(v => v._id.toString()));

        // Add permanent address volunteers that aren't already in nearby list
        permanentAddressVolunteers.forEach(vol => {
            if (!nearbyVolunteerIds.has(vol._id.toString())) {
                allVolunteers.push(vol);
            }
        });

        console.log(`Found ${nearbyVolunteers.length} volunteers by current location`);
        console.log(`Found ${permanentAddressVolunteers.length} volunteers by permanent address`);
        console.log(`Total unique volunteers to notify: ${allVolunteers.length}`);

        // Add them to notified list (async update)
        const allVolunteerIds = allVolunteers.map(v => v._id);
        emergency.volunteersNotified = allVolunteerIds;
        await emergency.save();

        // Emit Socket Event to Volunteers
        const io = req.app.get('socketio');
        if (io) {
            allVolunteerIds.forEach(volId => {
                io.to(volId.toString()).emit('new_emergency', {
                    emergencyId: emergency._id,
                    type: emergency.type,
                    location: emergency.location,
                    requester: req.user.name
                });
            });
        }

        // Send email notifications to all volunteers
        let emailResults = null;
        if (allVolunteers.length > 0) {
            let requester;
            try {
                // Get requester details
                // Get requester details with emergency contacts
                requester = await User.findById(req.user.id).select('name permanentAddress emergencyContacts');

                // Send emails to volunteers
                emailResults = await sendEmergencyNotifications(
                    allVolunteers,
                    emergency,
                    requester
                );

                console.log('Email notification results:', emailResults);
            } catch (emailError) {
                console.error('Failed to send email notifications:', emailError.message);
                emailResults = { success: false, error: emailError.message, emailsSent: 0 };
            }

            // Notify Emergency Contacts
            if (requester && requester.emergencyContacts && requester.emergencyContacts.length > 0) {
                const { sendEmergencyAlertToContacts } = require('../utils/emailService');
                sendEmergencyAlertToContacts(requester.emergencyContacts, emergency, requester)
                    .then(() => console.log('Emergency contact alerts sent'))
                    .catch(err => console.error('Failed to send contact alerts:', err));
            }
        }
        console.log("all volunteers found", allVolunteers.length)
        res.status(201).json({
            success: true,
            data: emergency,
            volunteersFound: {
                total: allVolunteers.length,
                byCurrentLocation: nearbyVolunteers.length,
                byPermanentAddress: permanentAddressVolunteers.length
            },
            notifications: {
                socket: 'Sent to all connected volunteers',
                email: emailResults || 'No volunteers found or email not configured'
            }
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
            .populate('assignedVolunteer', 'name phone location')
            .populate('reviews');

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
            .populate('reviews')
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
            return res.status(403).json({ success: false, message: 'Not authorized to update this emergency' });
        }

        // Validate status
        const validStatuses = ['Searching', 'Accepted', 'On The Way', 'Arrived', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                validStatuses
            });
        }

        // Prevent reverting from Completed status
        if (emergency.status === 'Completed' && status !== 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change status once rescue is completed'
            });
        }

        const oldStatus = emergency.status;
        emergency.status = status;
        await emergency.save();

        console.log(`Emergency ${emergency._id} status updated from ${oldStatus} to ${status} by user ${req.user.id}`);

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

        res.status(200).json({
            success: true,
            data: emergency,
            message: `Emergency status updated to ${status}`
        });

    } catch (error) {
        console.error('Error updating emergency status:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
// @desc    Get nearby emergencies
// @route   GET /api/emergency/nearby
// @access  Private
exports.getNearbyEmergencies = async (req, res) => {
    try {
        const { latitude, longitude, radius } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const r = parseFloat(radius) || 5; // Default 5km

        const emergencies = await Emergency.find({
            status: 'Searching',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lon, lat]
                    },
                    $maxDistance: r * 1000 // meters
                }
            }
        }).populate('requester', 'name phone');

        res.status(200).json({
            success: true,
            count: emergencies.length,
            data: emergencies
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get emergencies assigned to the volunteer
// @route   GET /api/emergency/assigned
// @access  Private (Volunteer)
exports.getAssignedEmergencies = async (req, res) => {
    try {
        // Find emergencies where this user is the assigned volunteer
        // Sort by updatedAt desc to get the most recent activity
        const emergencies = await Emergency.find({
            assignedVolunteer: req.user.id,
            status: { $in: ['Accepted', 'On The Way'] } // Only active ones primarily
        })
            .populate('requester', 'name phone')
            .populate('reviews')
            .sort({ updatedAt: -1 });

        // If no active, maybe fetch the last completed one?
        // For now, let's just return what we found. 
        // If the user wants history, we can remove the status filter or make it optional.
        // The requirement says "resent accept emergency", imply current or just finished.
        // Let's widen the filter to include 'Completed' but limit to 1 for the profile view if we just want "the recent one".

        // Actually, let's fetch ALL assigned, sorted by date, and let frontend pick the first one.
        // Or better, just return the most recent one to save bandwidth if that's all needed.
        // But maybe user wants a list? User said "show resent accept emergency" (singular/plural ambiguous). 
        // "if user click vew more show same map chat section" implies a specific one.

        const recentEmergency = await Emergency.findOne({
            assignedVolunteer: req.user.id
        })
            .populate('requester', 'name phone')
            .populate('reviews')
            .sort({ updatedAt: -1 });

        if (!recentEmergency) {
            return res.status(200).json({ success: true, data: null });
        }

        res.status(200).json({
            success: true,
            data: recentEmergency
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update volunteer location for tracking
// @route   POST /api/emergency/:id/location
// @access  Private (Volunteer)
exports.updateVolunteerLocation = async (req, res) => {
    try {
        const { latitude, longitude, heading, speed, accuracy } = req.body;
        const emergency = await Emergency.findById(req.params.id);

        if (!emergency) {
            return res.status(404).json({ success: false, message: 'Emergency not found' });
        }

        // Check if user is the assigned volunteer
        if (emergency.assignedVolunteer?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this emergency' });
        }

        // Validate coordinates
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return res.status(400).json({ success: false, message: 'Invalid coordinates' });
        }

        // Update or add volunteer location in tracking array
        const locationEntry = {
            userId: req.user.id,
            location: {
                type: 'Point',
                coordinates: [lon, lat],
                timestamp: new Date(),
                heading: heading ? parseFloat(heading) : undefined,
                speed: speed ? parseFloat(speed) : undefined,
                accuracy: accuracy ? parseFloat(accuracy) : undefined
            }
        };

        // Remove existing entry for this user if exists
        emergency.tracking.volunteerLocations = emergency.tracking.volunteerLocations
            .filter(loc => loc.userId.toString() !== req.user.id);

        // Add new location entry
        emergency.tracking.volunteerLocations.push(locationEntry);

        // Calculate ETA if we have requester location
        if (emergency.location && emergency.location.coordinates) {
            const requesterCoords = emergency.location.coordinates; // [lng, lat]
            const distance = calculateDistance(
                lat, lon, 
                requesterCoords[1], requesterCoords[0] // lat, lng
            );
            
            // Estimate speed (assume walking speed ~1.4 m/s if not provided)
            const currentSpeed = speed || 1.4;
            const etaSeconds = distance / currentSpeed;
            
            emergency.tracking.estimatedArrivalTime = new Date(Date.now() + etaSeconds * 1000);
        }

        await emergency.save();

        // Emit location update to requester via socket
        const io = req.app.get('socketio');
        if (io) {
            io.to(emergency.requester.toString()).emit('volunteer_location_update', {
                emergencyId: emergency._id,
                volunteerId: req.user.id,
                latitude: lat,
                longitude: lon,
                heading,
                speed,
                accuracy,
                timestamp: new Date()
            });
        }

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            data: {
                emergencyId: emergency._id,
                location: { latitude: lat, longitude: lon },
                eta: emergency.tracking.estimatedArrivalTime
            }
        });

    } catch (error) {
        console.error('Error updating volunteer location:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update emergency tracking status
// @route   POST /api/emergency/:id/tracking-status
// @access  Private (Volunteer/Requester)
exports.updateTrackingStatus = async (req, res) => {
    try {
        const { status, latitude, longitude } = req.body;
        const emergency = await Emergency.findById(req.params.id);

        if (!emergency) {
            return res.status(404).json({ success: false, message: 'Emergency not found' });
        }

        // Check if user is authorized (requester or assigned volunteer)
        const isAuthorized = emergency.requester.toString() === req.user.id ||
                           emergency.assignedVolunteer?.toString() === req.user.id;
        
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this emergency' });
        }

        // Validate status
        const validStatuses = ['Accepted', 'On The Way', 'Arrived', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                validStatuses
            });
        }

        // Add status update to tracking history
        const statusUpdate = {
            status,
            timestamp: new Date(),
            userId: req.user.id
        };

        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            if (!isNaN(lat) && !isNaN(lon)) {
                statusUpdate.location = {
                    type: 'Point',
                    coordinates: [lon, lat]
                };
            }
        }

        emergency.tracking.statusUpdates.push(statusUpdate);

        // Update main emergency status
        emergency.status = status;
        await emergency.save();

        // Emit status update via socket
        const io = req.app.get('socketio');
        if (io) {
            const recipientId = emergency.requester.toString() === req.user.id
                ? emergency.assignedVolunteer?.toString()
                : emergency.requester.toString();
            
            if (recipientId) {
                io.to(recipientId).emit('tracking_status_update', {
                    emergencyId: emergency._id,
                    status,
                    userId: req.user.id,
                    userName: req.user.name,
                    timestamp: new Date()
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Status updated to ${status}`,
            data: {
                emergencyId: emergency._id,
                status,
                statusUpdate
            }
        });

    } catch (error) {
        console.error('Error updating tracking status:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get emergency tracking data
// @route   GET /api/emergency/:id/tracking
// @access  Private (Requester/Volunteer)
exports.getTrackingData = async (req, res) => {
    try {
        const emergency = await Emergency.findById(req.params.id)
            .populate('tracking.volunteerLocations.userId', 'name')
            .populate('tracking.statusUpdates.userId', 'name');

        if (!emergency) {
            return res.status(404).json({ success: false, message: 'Emergency not found' });
        }

        // Check if user is authorized
        const isAuthorized = emergency.requester.toString() === req.user.id ||
                           emergency.assignedVolunteer?.toString() === req.user.id;
        
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this emergency' });
        }

        res.status(200).json({
            success: true,
            data: {
                emergencyId: emergency._id,
                volunteerLocations: emergency.tracking.volunteerLocations,
                estimatedArrivalTime: emergency.tracking.estimatedArrivalTime,
                route: emergency.tracking.route,
                statusUpdates: emergency.tracking.statusUpdates,
                currentStatus: emergency.status
            }
        });

    } catch (error) {
        console.error('Error fetching tracking data:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}
