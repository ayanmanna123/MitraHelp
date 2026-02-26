const { admin, isFirebaseInitialized } = require('../config/firebase');
const User = require('../models/user.model');

/**
 * Send push notification to a single device
 * @param {string} fcmToken - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<object>}
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!isFirebaseInitialized()) {
        console.log('Firebase not initialized, skipping push notification');
        return { success: false, reason: 'firebase_not_initialized' };
    }

    if (!fcmToken) {
        return { success: false, reason: 'no_token' };
    }

    try {
        // Ensure all data values are strings (FCM requirement)
        const stringData = {};
        for (const [key, value] of Object.entries(data)) {
            stringData[key] = String(value);
        }

        const message = {
            token: fcmToken,
            notification: {
                title,
                body
            },
            data: stringData,
            webpush: {
                notification: {
                    icon: '/vite.svg',
                    badge: '/vite.svg',
                    requireInteraction: true,
                    actions: [
                        { action: 'open', title: 'View Details' }
                    ]
                },
                fcmOptions: {
                    link: stringData.click_action || '/'
                }
            }
        };

        const response = await admin.messaging().send(message);
        console.log('Push notification sent:', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('Error sending push notification:', error.message);

        // Handle invalid/expired tokens
        if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
        ) {
            await removeStaleToken(fcmToken);
        }

        return { success: false, error: error.message };
    }
};

/**
 * Send push notification to multiple devices
 * @param {string[]} fcmTokens - Array of FCM device tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<object>}
 */
const sendPushToMultiple = async (fcmTokens, title, body, data = {}) => {
    if (!isFirebaseInitialized()) {
        console.log('Firebase not initialized, skipping push notifications');
        return { success: false, reason: 'firebase_not_initialized' };
    }

    const validTokens = fcmTokens.filter(Boolean);
    if (validTokens.length === 0) {
        return { success: false, reason: 'no_tokens' };
    }

    try {
        // Ensure all data values are strings
        const stringData = {};
        for (const [key, value] of Object.entries(data)) {
            stringData[key] = String(value);
        }

        const message = {
            notification: {
                title,
                body
            },
            data: stringData,
            webpush: {
                notification: {
                    icon: '/vite.svg',
                    badge: '/vite.svg',
                    requireInteraction: true
                },
                fcmOptions: {
                    link: stringData.click_action || '/'
                }
            },
            tokens: validTokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Push notifications sent: ${response.successCount}/${validTokens.length} successful`);

        // Clean up stale tokens
        if (response.failureCount > 0) {
            const staleTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    if (
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered'
                    ) {
                        staleTokens.push(validTokens[idx]);
                    }
                }
            });

            if (staleTokens.length > 0) {
                await removeStaleTokens(staleTokens);
            }
        }

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        console.error('Error sending push notifications:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Remove a single stale FCM token from the database
 */
const removeStaleToken = async (token) => {
    try {
        await User.updateOne(
            { fcmToken: token },
            { $unset: { fcmToken: '' } }
        );
        console.log('Removed stale FCM token');
    } catch (error) {
        console.error('Error removing stale token:', error.message);
    }
};

/**
 * Remove multiple stale FCM tokens from the database
 */
const removeStaleTokens = async (tokens) => {
    try {
        await User.updateMany(
            { fcmToken: { $in: tokens } },
            { $unset: { fcmToken: '' } }
        );
        console.log(`Removed ${tokens.length} stale FCM tokens`);
    } catch (error) {
        console.error('Error removing stale tokens:', error.message);
    }
};

module.exports = { sendPushNotification, sendPushToMultiple };
