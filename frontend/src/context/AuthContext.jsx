import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

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

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
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

    const value = {
        user,
        loading,
        sendOtp,
        verifyOtp,
        logout,
        refreshUserData
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
