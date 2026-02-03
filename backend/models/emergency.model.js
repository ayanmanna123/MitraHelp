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
        address: String // Human readable address
    },
    status: {
        type: String,
        enum: ['Searching', 'Accepted', 'On The Way', 'Completed', 'Cancelled'],
        default: 'Searching'
    },
    assignedVolunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    volunteersNotified: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for geospatial queries
emergencySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Emergency', emergencySchema);
