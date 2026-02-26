/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// This handles push notifications when the app is in the background or closed.
//
// IMPORTANT: Replace the firebaseConfig values below with your actual Firebase config.
// Service workers cannot access environment variables, so these must be hardcoded.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'MitraHelp Alert';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: payload.data?.emergencyId || 'mitrahelp-notification',
        requireInteraction: true,
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();

    const clickAction = event.notification.data?.click_action;
    const emergencyId = event.notification.data?.emergencyId;

    // Determine URL to open
    let urlToOpen = '/dashboard';
    if (clickAction) {
        urlToOpen = clickAction;
    } else if (emergencyId) {
        urlToOpen = `/emergency/${emergencyId}`;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it and navigate
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
