import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FaAmbulance, FaMapMarkerAlt, FaClock, FaUserMd, FaCarCrash, FaTint, FaExclamationTriangle, FaEllipsisH, FaLocationArrow } from 'react-icons/fa';

const NeedHelp = () => {
    const { user, getCurrentLocation } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [emergencies, setEmergencies] = useState([]);
    const [activeEmergency, setActiveEmergency] = useState(null);
    const [updatingLocation, setUpdatingLocation] = useState(false);

    // Emergency types with icons
    const emergencyTypes = [
        { id: 'Medical', label: 'Medical Emergency', icon: FaUserMd, color: 'text-red-500', bg: 'bg-red-50' },
        { id: 'Accident', label: 'Accident', icon: FaCarCrash, color: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 'Blood', label: 'Blood Donation Needed', icon: FaTint, color: 'text-red-600', bg: 'bg-red-50' },
        { id: 'Disaster', label: 'Natural Disaster', icon: FaExclamationTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { id: 'Other', label: 'Other Emergency', icon: FaEllipsisH, color: 'text-gray-500', bg: 'bg-gray-50' }
    ];

    useEffect(() => {
        fetchUserEmergencies();
    }, []);

    const fetchUserEmergencies = async () => {
        try {
            const response = await api.get('/emergency/user');
            if (response.data.success) {
                setEmergencies(response.data.data);
                // Find active emergency (not completed or cancelled)
                const active = response.data.data.find(e => 
                    e.status !== 'Completed' && e.status !== 'Cancelled'
                );
                setActiveEmergency(active || null);
            }
        } catch (error) {
            console.error('Error fetching emergencies:', error);
        }
    };

    const handleRequestHelp = async (type) => {
        // Get current location if not available or invalid
        let latitude, longitude;
        
        if (!user?.location?.coordinates || 
            user.location.coordinates.length !== 2 ||
            user.location.coordinates[0] === 0 || 
            user.location.coordinates[1] === 0) {
            
            setUpdatingLocation(true);
            try {
                const locationData = await getCurrentLocation();
                latitude = locationData.latitude;
                longitude = locationData.longitude;
                // Refresh user data to get updated location
                await fetchUserEmergencies();
            } catch (error) {
                toast.error('Unable to get your location. Please enable location services.');
                setUpdatingLocation(false);
                return;
            } finally {
                setUpdatingLocation(false);
            }
        } else {
            // Use existing valid location
            latitude = user.location.coordinates[1];
            longitude = user.location.coordinates[0];
        }
        
        // Validate coordinates
        if (isNaN(latitude) || isNaN(longitude)) {
            toast.error('Invalid location coordinates. Please refresh your location.');
            return;
        }

        console.log('Creating emergency with location:', { latitude, longitude, type });

        setLoading(true);
        try {
            const response = await api.post('/emergency', {
                type,
                description: `Emergency request for ${type}`,
                latitude: latitude,
                longitude: longitude,
                address: user.location.address || `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });

            if (response.data.success) {
                toast.success('Emergency request sent! Volunteers are being notified.');
                setActiveEmergency(response.data.data);
                fetchUserEmergencies();
                navigate(`/emergency/${response.data.data._id}`);
            }
        } catch (error) {
            console.error('Error creating emergency:', error);
            console.error('Error response:', error.response?.data);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               error.message || 
                               'Failed to create emergency request';
            
            toast.error(`Emergency Error: ${errorMessage}`);
            
            // Log detailed error info for debugging
            if (error.response?.data?.received) {
                console.log('Received data:', error.response.data.received);
            }
            if (error.response?.data?.validTypes) {
                console.log('Valid types:', error.response.data.validTypes);
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Searching': return 'bg-yellow-100 text-yellow-800';
            case 'Accepted': return 'bg-blue-100 text-blue-800';
            case 'On The Way': return 'bg-purple-100 text-purple-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                            <FaAmbulance className="text-red-500" />
                            Need Help
                        </h1>
                        <button 
                            onClick={() => navigate('/user-dashboard')}
                            className="text-gray-600 hover:text-red-600 font-medium"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Active Emergency Card */}
                {activeEmergency && (
                    <div className="mb-8 bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Active Emergency</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activeEmergency.status)}`}>
                                {activeEmergency.status}
                            </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-red-500" />
                                <span className="text-gray-600">
                                    {activeEmergency.location?.address || 
                                     `${activeEmergency.location?.coordinates[1]?.toFixed(4)}, ${activeEmergency.location?.coordinates[0]?.toFixed(4)}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaClock className="text-gray-500" />
                                <span className="text-gray-600">
                                    {new Date(activeEmergency.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate(`/emergency/${activeEmergency._id}`)}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium"
                            >
                                Track Progress
                            </button>
                            <button
                                onClick={fetchUserEmergencies}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                )}

                {/* Emergency Type Selection */}
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">What type of help do you need?</h2>
                        <button
                            onClick={async () => {
                                setUpdatingLocation(true);
                                try {
                                    await getCurrentLocation();
                                    toast.success('Location updated successfully');
                                } catch (error) {
                                    // Error already handled in getCurrentLocation
                                } finally {
                                    setUpdatingLocation(false);
                                }
                            }}
                            disabled={updatingLocation}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaLocationArrow className={`${updatingLocation ? 'animate-spin' : ''}`} />
                            {updatingLocation ? 'Updating...' : 'Refresh Location'}
                        </button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {emergencyTypes.map((type) => {
                            const IconComponent = type.icon;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => handleRequestHelp(type.id)}
                                    disabled={loading || activeEmergency}
                                    className={`${type.bg} border border-gray-200 rounded-xl p-6 text-left hover:shadow-md transition-all duration-200 hover:border-red-300 ${
                                        loading || activeEmergency ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-lg ${type.bg}`}>
                                            <IconComponent className={`text-2xl ${type.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{type.label}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {type.id === 'Medical' && 'Medical assistance, ambulance, first aid'}
                                                {type.id === 'Accident' && 'Vehicle accidents, injuries, rescue'}
                                                {type.id === 'Blood' && 'Urgent blood donation required'}
                                                {type.id === 'Disaster' && 'Earthquake, flood, fire, etc.'}
                                                {type.id === 'Other' && 'Any other emergency situation'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {activeEmergency && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-center">
                                <span className="font-medium">Note:</span> You already have an active emergency request. 
                                Please wait for volunteer response or cancel the current request before creating a new one.
                            </p>
                        </div>
                    )}

                    {loading && (
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending emergency request...
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Emergencies */}
                {emergencies.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Recent Requests</h2>
                        <div className="space-y-3">
                            {emergencies.slice(0, 5).map((emergency) => (
                                <div 
                                    key={emergency._id} 
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/emergency/${emergency._id}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-800">{emergency.type} Emergency</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {emergency.location?.address || 
                                                 `${emergency.location?.coordinates[1]?.toFixed(4)}, ${emergency.location?.coordinates[0]?.toFixed(4)}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(emergency.status)}`}>
                                                {emergency.status}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(emergency.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NeedHelp;