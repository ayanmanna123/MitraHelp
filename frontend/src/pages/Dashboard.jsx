import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUserShield, FaChartBar, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [volunteerProgress, setVolunteerProgress] = useState(null);

    useEffect(() => {
        if (user?.role === 'volunteer' || user?.role === 'user') {
            fetchVolunteerProgress();
        }
    }, [user]);

    const fetchVolunteerProgress = async () => {
        try {
            const response = await api.get('/volunteer/progress');
            if (response.data.success) {
                setVolunteerProgress(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching volunteer progress:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-red-600">MitraHelp Dashboard</h1>
                <button onClick={logout} className="text-gray-600 hover:text-red-600 font-medium">
                    Logout
                </button>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow p-6 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-gray-100 p-4 rounded-full">
                            <FaUserShield size={24} className="text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
                            <p className="text-gray-500">{user?.phone}</p>
                        </div>
                        <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
                            {user?.role}
                        </span>
                    </div>

                    {/* Volunteer Progress Bar for Volunteers */}
                    {(user?.role === 'volunteer' || user?.role === 'user') && user?.volunteerStatus !== 'approved' && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-blue-800">Volunteer Registration Progress</h3>
                                <Link to="/volunteer-profile" className="text-blue-600 hover:text-blue-800 flex items-center">
                                    View Details <FaArrowRight className="ml-1 text-sm" />
                                </Link>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                                    style={{ width: `${volunteerProgress?.percentage || 0}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-600">
                                {volunteerProgress?.completedSteps || 0} of {volunteerProgress?.totalSteps || 3} steps completed
                            </p>
                        </div>
                    )}

                    {user?.role === 'volunteer' && user?.volunteerStatus === 'approved' && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-green-800 flex items-center">
                                    <FaChartBar className="mr-2" /> Volunteer Status: Authenticated
                                </h3>
                                <Link to="/volunteer-profile" className="text-green-600 hover:text-green-800 flex items-center">
                                    View Profile <FaArrowRight className="ml-1 text-sm" />
                                </Link>
                            </div>
                            <p className="text-sm text-green-700 mt-1">You are authenticated and ready to help in emergencies.</p>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <FaMapMarkerAlt className="text-red-500" /> Current Location
                            </h3>
                            <p className="text-gray-600">
                                {user?.location?.coordinates
                                    ? `${user.location.coordinates[1].toFixed(4)}, ${user.location.coordinates[0].toFixed(4)}`
                                    : 'Location not set'}
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2">Availability</h3>
                            <p className="text-gray-600">
                                {user?.isAvailable ? 'Available for help' : 'Not available'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-red-50 border border-red-100 p-6 rounded-xl hover:shadow-md transition cursor-pointer">
                        <h3 className="text-xl font-bold text-red-800 mb-2">Request Emergency Help</h3>
                        <p className="text-red-600">Get immediate assistance from nearby volunteers.</p>
                    </div>
                    {user?.role === 'volunteer' && (
                        <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl hover:shadow-md transition cursor-pointer">
                            <h3 className="text-xl font-bold text-blue-800 mb-2">View Nearby Alerts</h3>
                            <p className="text-blue-600">See emergency requests in your area.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
