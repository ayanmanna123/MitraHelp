import { useState, useEffect, useCallback } from 'react';
import { getNotificationToken, onForegroundMessage, isFirebaseConfigured } from '../config/firebase';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const usePushNotification = (user) => {
    const [permissionStatus, setPermissionStatus] = useState('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        const supported = 'Notification' in window &&
            'serviceWorker' in navigator &&
            isFirebaseConfigured();
        setIsSupported(supported);

        if (supported) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    // Save FCM token to backend
    const saveFcmToken = useCallback(async (token) => {
        try {
            await api.put('/users/fcm-token', { fcmToken: token });
        } catch (error) {
            console.error('Failed to save FCM token:', error);
        }
    }, []);

    // Request permission and register token
    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            const token = await getNotificationToken();
            if (token) {
                await saveFcmToken(token);
                setPermissionStatus('granted');
                return true;
            }
            setPermissionStatus(Notification.permission);
            return false;
        } catch (error) {
            console.error('Error requesting push permission:', error);
            setPermissionStatus('denied');
            return false;
        }
    }, [isSupported, saveFcmToken]);

    // Auto-register when user logs in and permission is already granted
    useEffect(() => {
        if (user && isSupported && Notification.permission === 'granted') {
            requestPermission();
        }
    }, [user, isSupported, requestPermission]);

    // Listen for foreground messages
    useEffect(() => {
        if (!user || !isSupported || Notification.permission !== 'granted') return;

        const unsubscribe = onForegroundMessage((payload) => {
            console.log('Foreground message:', payload);

            const title = payload.notification?.title || 'MitraHelp';
            const body = payload.notification?.body || '';

            // Show as toast (don't show browser notification since app is in foreground)
            const emergencyType = payload.data?.type;
            if (emergencyType === 'emergency_accepted' || title.includes('Volunteer')) {
                toast.success(`${title}: ${body}`, { duration: 6000 });
            } else {
                toast(
                    `${title}: ${body}`,
                    {
                        duration: 6000,
                        icon: '🔔'
                    }
                );
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, isSupported]);

    return {
        permissionStatus,
        requestPermission,
        isSupported
    };
};

export default usePushNotification;
