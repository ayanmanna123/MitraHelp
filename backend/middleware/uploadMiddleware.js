const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'volunteers',
        format: async (req, file) => 'jpg', // supports promises as well
        public_id: (req, file) => {
            const fileExt = path.extname(file.originalname).slice(1);
            return `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        },
    },
});

// Create local storage for temporary face verification files
const faceVerificationDir = path.join(__dirname, '../uploads/face-verification');
if (!fs.existsSync(faceVerificationDir)) {
    fs.mkdirSync(faceVerificationDir, { recursive: true });
}

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, faceVerificationDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Export different upload configurations
const cloudinaryUpload = multer({
    storage: cloudinaryStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const localUpload = multer({
    storage: localStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// For face verification, we need to temporarily store files locally for processing
const faceVerificationUpload = multer({
    storage: multer.memoryStorage(), // Store in memory for processing in controller
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = {
    upload: cloudinaryUpload,
    localUpload: localUpload,
    faceVerificationUpload: faceVerificationUpload
};
