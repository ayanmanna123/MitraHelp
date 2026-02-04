import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { googleLogout } from '@react-oauth/google';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    if (data.success) {
                        setUser(data.data);
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const sendOtp = async (phone) => {
        try {
            const { data } = await api.post('/auth/send-otp', { phone });
            if (data.success) {
                toast.success(data.message);
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
            return false;
        }
    };

    const verifyOtp = async (phone, otp, role = 'user') => {
        try {
            const { data } = await api.post('/auth/verify-otp', { phone, otp, role });
            if (data.success) {
                localStorage.setItem('token', data.token);
                setUser(data.user);
                toast.success(data.message);
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to verify OTP');
            return false;
        }
    };

    const googleLogin = async (idToken) => {
        try {
            const { data } = await api.post('/auth/google', { idToken });
            if (data.success) {
                localStorage.setItem('token', data.token);
                setUser(data.user);
                toast.success(data.isNewUser ? 'Account created successfully' : 'Login successful');
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Google login failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        googleLogout(); // Logout from Google as well
        toast.success('Logged out successfully');
    };

    const refreshUserData = async () => {
        try {
            const { data } = await api.get('/auth/me');
            if (data.success) {
                setUser(data.data);
                return data.data;
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    const updateLocation = async (latitude, longitude) => {
        try {
            console.log('Updating location with:', { latitude, longitude });
            const { data } = await api.put('/users/location', { latitude, longitude });
            console.log('Location update response:', data);
            
            if (data.success) {
                setUser(prev => ({
                    ...prev,
                    location: data.data.location
                }));
                toast.success('Location updated successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating location:', error);
            console.error('Error response:', error.response?.data);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'Failed to update location';
            
            toast.error(`Location Error: ${errorMessage}`);
            return false;
        }
    };

    const getCurrentLocation = async () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                toast.error('Geolocation is not supported by your browser');
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        await updateLocation(latitude, longitude);
                        resolve({ latitude, longitude });
                    } catch (error) {
                        reject(error);
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    let message = 'Unable to get your location';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Location access denied. Please enable location services.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            message = 'Location request timed out.';
                            break;
                        default:
                            message = 'An unknown error occurred while getting location.';
                    }
                    
                    toast.error(message);
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    };

    const getLocationFromUser = async () => {
        try {
            const { data } = await api.get('/users/location');
            if (data.success) {
                return data.data;
            }
        } catch (error) {
            console.error('Error getting location from user:', error);
        }
        return null;
    };

    const value = {
        user,
        loading,
        sendOtp,
        verifyOtp,
        googleLogin,
        logout,
        refreshUserData,
        updateLocation,
        getCurrentLocation,
        getLocationFromUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
