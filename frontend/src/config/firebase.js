import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app = null;
let messaging = null;

// Only initialize if config is provided
const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId;
};

if (isFirebaseConfigured()) {
    try {
        app = initializeApp(firebaseConfig);
        // Messaging only works in secure contexts (HTTPS or localhost)
        if ('Notification' in window && 'serviceWorker' in navigator) {
            messaging = getMessaging(app);
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null
 */
export const getNotificationToken = async () => {
    if (!messaging) {
        console.log('Firebase messaging not initialized');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log('FCM token obtained');
            return token;
        }

        console.log('No FCM token available');
        return null;
    } catch (error) {
        console.error('Error getting notification token:', error);
        return null;
    }
};

/**
 * Listen for foreground messages
 * @param {function} callback - Called with message payload
 * @returns {function|null} Unsubscribe function
 */
export const onForegroundMessage = (callback) => {
    if (!messaging) return null;
    return onMessage(messaging, callback);
};

export { messaging, isFirebaseConfigured };
