import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'volunteer') {
                navigate('/volunteer-dashboard');
            } else if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/user-dashboard');
            }
        }
    }, [user, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
    );
};

export default Dashboard;
