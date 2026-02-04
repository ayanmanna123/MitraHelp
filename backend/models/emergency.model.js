const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Medical', 'Accident', 'Blood', 'Disaster', 'Other'],
        required: true
    },
    description: {
        type: String
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: {
            type: String,
            default: 'Unknown Location'
        }
    },
    status: {
        type: String,
        enum: ['Searching', 'Accepted', 'On The Way', 'Arrived', 'Completed', 'Cancelled'],
        default: 'Searching'
    },
    assignedVolunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    volunteersNotified: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Tracking fields for real-time location updates
    tracking: {
        volunteerLocations: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            location: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point'
                },
                coordinates: {
                    type: [Number], // [longitude, latitude]
                },
                timestamp: {
                    type: Date,
                    default: Date.now
                },
                heading: Number, // Direction in degrees
                speed: Number,   // Speed in m/s
                accuracy: Number // Accuracy in meters
            }
        }],
        estimatedArrivalTime: Date,
        route: {
            type: {
                type: String,
                enum: ['LineString'],
                default: 'LineString'
            },
            coordinates: [[Number]] // Array of [longitude, latitude] points
        },
        statusUpdates: [{
            status: {
                type: String,
                enum: ['Searching', 'Accepted', 'On The Way', 'Arrived', 'Completed', 'Cancelled']
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            location: {
                type: {
                    type: String,
                    enum: ['Point']
                },
                coordinates: [Number]
            }
        }]
    }
}, {
    timestamps: true
});

// Index for geospatial queries
emergencySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Emergency', emergencySchema);
