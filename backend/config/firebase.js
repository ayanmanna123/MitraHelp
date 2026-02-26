const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

const initializeFirebase = () => {
    if (firebaseInitialized) return;

    try {
        const serviceAccountPath = path.resolve(
            __dirname,
            process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
        );

        if (!fs.existsSync(serviceAccountPath)) {
            console.warn('Firebase service account file not found at:', serviceAccountPath);
            console.warn('Push notifications will be disabled. See .env.example for setup instructions.');
            return;
        }

        const serviceAccount = require(serviceAccountPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        firebaseInitialized = true;
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error.message);
        console.warn('Push notifications will be disabled.');
    }
};

const isFirebaseInitialized = () => firebaseInitialized;

module.exports = { admin, initializeFirebase, isFirebaseInitialized };
