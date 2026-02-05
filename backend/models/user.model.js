const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true, // Allow null/undefined to be unique (though we want one of phone/email)
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    profilePicture: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'volunteer', 'admin'],
        default: 'user'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        },
        address: {
            type: String,
            default: 'Unknown Location'
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    permanentAddress: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        },
        address: {
            type: String,
            default: 'Unknown Address'
        }
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
        default: 'Unknown'
    },
    fcmToken: {
        type: String
    },
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    governmentIdImage: {
        type: String // URL from S3
    },
    selfieImage: {
        type: String // URL from S3
    },
    volunteerStatus: {
        type: String,
        enum: ['not_applied', 'pending', 'approved', 'rejected'],
        default: 'not_applied'
    },
    rejectionReason: {
        type: String
    },
    volunteerProgress: {
        personalInfoComplete: {
            type: Boolean,
            default: false
        },
        documentsUploaded: {
            type: Boolean,
            default: false
        },
        verificationPending: {
            type: Boolean,
            default: false
        },
        profileCompletionSteps: {
            type: [String],
            default: ['personal_info', 'document_upload', 'verification']
        }
    },
    faceVerification: {
        governmentIdImage: String,
        selfieImage: String,
        status: {
            type: String,
            enum: ['not_submitted', 'pending', 'verified', 'rejected'],
            default: 'not_submitted'
        },
        matchScore: Number, // Face match score (0-1)
        submittedAt: Date,
        verifiedAt: Date,
        adminReviewedAt: Date,
        adminNotes: String
    },
    emergencyContacts: [{
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        relation: {
            type: String,
            default: 'Friend'
        }
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Create indexes for efficient queries
userSchema.index({ averageRating: 1 });
userSchema.index({ totalReviews: 1 });
userSchema.index({ role: 1, averageRating: -1 });
userSchema.index({ role: 1, totalReviews: -1 });

// Create 2dsphere index for geospatial queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ 'permanentAddress.coordinates': '2dsphere' });

module.exports = mongoose.model('User', userSchema);
