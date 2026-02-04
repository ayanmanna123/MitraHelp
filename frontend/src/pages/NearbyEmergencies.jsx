import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaMapMarkerAlt, FaPhone, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const NearbyEmergencies = () => {
    const { user } = useAuth();
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState(null);

    useEffect(() => {
        // Get current location first
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                    fetchEmergencies(latitude, longitude);
                },
                (err) => {
                    console.error("Error getting location:", err);
                    // Fallback to user's saved location if available
                    if (user?.location?.coordinates) {
                        const [lon, lat] = user.location.coordinates;
                        setLocation({ latitude: lat, longitude: lon });
                        fetchEmergencies(lat, lon);
                    } else {
                        setError('Unable to get your location. Please enable location services.');
                        setLoading(false);
                    }
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
            setLoading(false);
        }
    }, [user]);

    const fetchEmergencies = async (lat, lon) => {
        try {
            setLoading(true);
            const res = await api.get(`/emergency/nearby?latitude=${lat}&longitude=${lon}&radius=10`); // 10km radius
            setEmergencies(res.data.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch nearby emergencies.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id) => {
        try {
            await api.put(`/emergency/${id}/accept`);
            // Refresh list or navigate to tracker
            alert('Emergency accepted! Redirecting to tracker...');
            // In a real app, navigate to a tracking page
            // navigate(`/emergency/${id}`);
            // For now, remove from list to reflect change
            setEmergencies(prev => prev.filter(e => e._id !== id));
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to accept emergency');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center gap-4">
                    <Link to="/volunteer-dashboard" className="text-gray-600 hover:text-gray-900">
                        <FaArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Nearby Alerts</h1>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                ) : emergencies.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
                            <FaUserShield size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Emergencies Nearby</h2>
                        <p className="text-gray-500">Great news! There are no active emergency requests in your area right now.</p>
                        <button
                            onClick={() => location && fetchEmergencies(location.latitude, location.longitude)}
                            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
                        >
                            Refresh
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {emergencies.map(emergency => (
                            <div key={emergency._id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-red-500 hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase">
                                                {emergency.type}
                                            </span>
                                            <span className="text-gray-400 text-sm">
                                                {new Date(emergency.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                                            {emergency.requester?.name || 'Unknown User'}
                                        </h3>
                                        <p className="text-gray-600 mb-3 flex items-start gap-2">
                                            <FaMapMarkerAlt className="mt-1 flex-shrink-0 text-red-400" />
                                            {emergency.location?.address || 'Location details unavailable'}
                                        </p>
                                        <p className="text-gray-700 italic">"{emergency.description}"</p>
                                    </div>
                                    <button
                                        onClick={() => handleAccept(emergency._id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm hover:shadow"
                                    >
                                        Accept
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Need to import FaUserShield since I used it in empty state
import { FaUserShield } from 'react-icons/fa';

export default NearbyEmergencies;
