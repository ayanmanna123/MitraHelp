const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    emergencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Emergency' // Optional: Link to specific emergency
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending'
    },
    adminNotes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
