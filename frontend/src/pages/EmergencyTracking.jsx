import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapComponent from '../components/map/MapComponent';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import { toast } from 'react-hot-toast';
import { FaPhoneAlt, FaUserShield, FaAmbulance, FaCheckCircle, FaSpinner, FaLocationArrow, FaRoute, FaClock, FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import ReviewModal from '../components/shared/ReviewModal';

const EmergencyTracking = () => {
    const { id } = useParams();
    const [emergency, setEmergency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [volunteerLocation, setVolunteerLocation] = useState(null);
    const [completingRescue, setCompletingRescue] = useState(false);
    const [trackingData, setTrackingData] = useState(null);
    const [eta, setEta] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const socket = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();
    const locationWatchId = useRef(null);

    const fetchEmergency = async () => {
        try {
            const { data } = await api.get(`/emergency/${id}`);
            if (data.success) {
                setEmergency(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load emergency details');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrackingData = async () => {
        try {
            const { data } = await api.get(`/emergency/${id}/tracking`);
            if (data.success) {
                setTrackingData(data.data);
                if (data.data.estimatedArrivalTime) {
                    setEta(new Date(data.data.estimatedArrivalTime));
                }
            }
        } catch (error) {
            console.error('Failed to fetch tracking data:', error);
        }
    };

    useEffect(() => {
        fetchEmergency();
        fetchTrackingData();
    }, [id]);

    useEffect(() => {
        if (socket) {
            socket.on('status_update', (data) => {
                if (data.emergencyId === id) {
                    setEmergency(prev => ({ ...prev, status: data.status }));
                    toast.success(`Status updated: ${data.status}`);
                    fetchEmergency();
                    fetchTrackingData();
                }
            });

            socket.on('emergency_accepted', (data) => {
                if (data.emergencyId === id) {
                    setEmergency(prev => ({
                        ...prev,
                        status: 'Accepted',
                        assignedVolunteer: {
                            name: data.volunteer,
                            phone: data.volunteerPhone,
                            location: data.volunteerLocation
                        }
                    }));
                    setVolunteerLocation(data.volunteerLocation?.coordinates);
                    toast.success(`${data.volunteer} accepted your request!`);
                }
            });

            // Listen for live location updates from volunteer
            socket.on('volunteer_location_update', (data) => {
                if (data.emergencyId === id) {
                    setVolunteerLocation([data.longitude, data.latitude]);
                    if (data.timestamp) {
                        setEta(calculateETA(data));
                    }
                }
            });

            // Listen for tracking status updates
            socket.on('tracking_status_update', (data) => {
                if (data.emergencyId === id) {
                    setEmergency(prev => ({ ...prev, status: data.status }));
                    toast.success(`${data.userName} updated status to: ${data.status}`);
                    fetchTrackingData();
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('status_update');
                socket.off('emergency_accepted');
                socket.off('volunteer_location_update');
                socket.off('tracking_status_update');
            }
        };
    }, [socket, id]);

    // Live Location Tracking for volunteers
    useEffect(() => {
        if (!emergency || !socket || !user) return;

        const isAssignedVolunteer = emergency.assignedVolunteer?._id === user._id ||
            (emergency.assignedVolunteer && emergency.assignedVolunteer === user._id);

        if (isAssignedVolunteer && emergency.status !== 'Completed') {
            // Start watching position
            locationWatchId.current = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude, heading, speed, accuracy } = position.coords;
                    
                    // Update local state immediately for smooth UI updates
                    setVolunteerLocation([longitude, latitude]);
                    
                    try {
                        // Send to backend
                        await api.post(`/emergency/${id}/location`, {
                            latitude,
                            longitude,
                            heading: heading || 0,
                            speed: speed || 0,
                            accuracy: accuracy || 0
                        });
                        
                        // Emit via socket for real-time updates
                        socket.emit('location_update', {
                            emergencyId: id,
                            userId: user._id,
                            role: 'volunteer',
                            latitude,
                            longitude,
                            heading,
                            speed,
                            accuracy
                        });
                    } catch (error) {
                        console.error('Error updating location:', error);
                    }
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    toast.error('Failed to get your location');
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 10000, 
                    maximumAge: 5000 
                }
            );

            return () => {
                if (locationWatchId.current) {
                    navigator.geolocation.clearWatch(locationWatchId.current);
                }
            };
        }
    }, [emergency, socket, user, id]);

    // Ensure both parties join the chat room when emergency is accepted
    useEffect(() => {
        if (socket && emergency && emergency.status === 'Accepted') {
            socket.emit('join_emergency', id);
            console.log('Joined emergency chat room:', id);
        }
    }, [socket, emergency, id]);

    // Calculate ETA based on distance and speed
    const calculateETA = (locationData) => {
        if (!emergency?.location?.coordinates || !locationData) return null;
        
        const requesterCoords = emergency.location.coordinates; // [lng, lat]
        const volunteerCoords = [locationData.longitude, locationData.latitude];
        
        // Calculate distance in meters
        const distance = calculateDistance(
            requesterCoords[1], requesterCoords[0],
            volunteerCoords[1], volunteerCoords[0]
        );
        
        // Estimate time (assuming walking speed ~1.4 m/s)
        const speed = locationData.speed || 1.4;
        const etaSeconds = distance / speed;
        
        return new Date(Date.now() + etaSeconds * 1000);
    };

    // Haversine distance calculation
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    };

    // Update tracking status
    const updateTrackingStatus = async (newStatus) => {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true
                });
            });
            
            const { latitude, longitude } = position.coords;
            
            const response = await api.post(`/emergency/${id}/tracking-status`, {
                status: newStatus,
                latitude,
                longitude
            });
            
            if (response.data.success) {
                setEmergency(prev => ({ ...prev, status: newStatus }));
                toast.success(`Status updated to: ${newStatus}`);
                
                // Emit via socket
                if (socket) {
                    socket.emit('tracking_status_update', {
                        emergencyId: id,
                        status: newStatus,
                        userId: user._id,
                        userName: user.name
                    });
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    // Submit review function
    const submitReview = async (reviewData) => {
        try {
            const response = await api.post(`/emergency/${id}/review`, reviewData);
            if (response.data.success) {
                toast.success(response.data.message);
                // Refresh emergency data to update UI
                fetchEmergency();
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!emergency) return <div className="p-8 text-center">Emergency not found</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Searching': return 'text-yellow-600 bg-yellow-100';
            case 'Accepted': return 'text-blue-600 bg-blue-100';
            case 'On The Way': return 'text-purple-600 bg-purple-100';
            case 'Arrived': return 'text-indigo-600 bg-indigo-100';
            case 'Completed': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    // Complete rescue function
    const completeRescue = async () => {
        if (emergency.status === 'Completed') {
            toast.error('This emergency is already completed');
            return;
        }

        if (!window.confirm('Are you sure you want to mark this rescue as completed?')) {
            return;
        }

        setCompletingRescue(true);
        try {
            await updateTrackingStatus('Completed');
        } catch (error) {
            console.error('Error completing rescue:', error);
            toast.error(error.response?.data?.message || 'Failed to complete rescue');
        } finally {
            setCompletingRescue(false);
        }
    };

    const markers = [];
    // Requester Marker
    if (emergency.location) {
        markers.push({
            position: emergency.location.coordinates.slice().reverse(), // [lat, lng]
            popupText: 'Emergency Location',
            icon: 'red'
        });
    }
    // Volunteer Marker - Use live location if available, else static
    const volLoc = volunteerLocation || emergency.assignedVolunteer?.location?.coordinates;
    if (volLoc) {
        markers.push({
            position: [volLoc[1], volLoc[0]], // [lat, lng]
            popupText: `Volunteer: ${emergency.assignedVolunteer?.name || 'Volunteer'}`,
            icon: 'blue'
        });
    }

    // Format ETA display
    const formatETA = (etaDate) => {
        if (!etaDate) return 'Calculating...';
        const now = new Date();
        const diff = etaDate - now;
        
        if (diff <= 0) return 'Arriving soon';
        
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Less than 1 min';
        if (minutes < 60) return `${minutes} min`;
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FaAmbulance className="text-red-600" />
                            {emergency.type} Emergency
                        </h1>
                        <p className="text-gray-500 text-sm">ID: {emergency._id}</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className={`px-4 py-2 rounded-full font-bold text-lg ${getStatusColor(emergency.status)}`}>
                            {emergency.status}
                        </div>
                        
                        {/* ETA Display */}
                        {eta && emergency.status === 'On The Way' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
                                <FaClock />
                                <span className="font-medium">ETA: {formatETA(eta)}</span>
                            </div>
                        )}
                        
                        {/* Status Update Buttons for Volunteer */}
                        {emergency.assignedVolunteer?._id === user._id && emergency.status !== 'Completed' && (
                            <div className="flex flex-wrap gap-2">
                                {emergency.status === 'Accepted' && (
                                    <button
                                        onClick={() => updateTrackingStatus('On The Way')}
                                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                                    >
                                        <FaRoute /> On The Way
                                    </button>
                                )}
                                {emergency.status === 'On The Way' && (
                                    <button
                                        onClick={() => updateTrackingStatus('Arrived')}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                                    >
                                        <FaLocationArrow /> Arrived
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* Complete Rescue Button - Only for requester */}
                        {emergency.requester?._id === user._id && emergency.status !== 'Completed' && (
                            <button
                                onClick={completeRescue}
                                disabled={completingRescue}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition ${completingRescue 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700'}
                                `}
                            >
                                {completingRescue ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        Completing...
                                    </>
                                ) : (
                                    <>
                                        <FaCheckCircle />
                                        Complete Rescue
                                    </>
                                )}
                            </button>
                        )}
                        
                        {/* Show confirmation when completed */}
                        {emergency.status === 'Completed' && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                                    <FaCheckCircle />
                                    <span className="font-medium">Rescue Completed</span>
                                </div>
                                {/* Show review button for requester after completion */}
                                {emergency.requester?._id === user._id && !emergency.reviews?.find(r => r.requester === user._id) && (
                                    <button
                                        onClick={() => setShowReviewModal(true)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                                    >
                                        <FaStar /> Rate Volunteer
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Map Area */}
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-4 text-gray-800">Live Tracking Map</h2>
                        <MapComponent
                            initialLocation={emergency.location.coordinates.slice().reverse()}
                            readOnly={true}
                            markers={markers}
                            height="500px"
                            showRoute={volLoc && emergency.location?.coordinates}
                            routePoints={volLoc ? [
                                [emergency.location.coordinates[1], emergency.location.coordinates[0]], // requester [lat, lng]
                                [volLoc[1], volLoc[0]] // volunteer [lat, lng]
                            ] : []}
                        />
                    </div>

                    {/* Info Sidebar */}
                    <div className="space-y-6">
                        {/* Volunteer Info Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">Assigned Volunteer</h2>
                            {emergency.assignedVolunteer ? (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                                        <FaUserShield size={40} className="text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-bold">{emergency.assignedVolunteer.name}</h3>
                                    <p className="text-gray-500 mb-4">{emergency.assignedVolunteer.phone}</p>

                                    <a href={`tel:${emergency.assignedVolunteer.phone}`} className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition">
                                        <FaPhoneAlt /> Call Volunteer
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="animate-pulse">
                                        <div className="h-12 w-12 bg-yellow-200 rounded-full mx-auto mb-2"></div>
                                        <p className="text-gray-600 font-medium">Searching for nearby volunteers...</p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">We have notified volunteers in your area.</p>
                                </div>
                            )}
                        </div>

                        {/* Tracking Info Card */}
                        {trackingData && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">Tracking Information</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status Updates:</span>
                                        <span className="font-medium">{trackingData.statusUpdates?.length || 0}</span>
                                    </div>
                                    {eta && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estimated Arrival:</span>
                                            <span className="font-medium text-blue-600">{formatETA(eta)}</span>
                                        </div>
                                    )}
                                    {volunteerLocation && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Volunteer Location:</span>
                                            <span className="font-medium text-green-600">Live</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold text-gray-700 mb-2">Details</h2>
                            <p className="text-gray-600 italic">
                                "{emergency.description || 'No description provided'}"
                            </p>
                            <div className="mt-3 text-sm text-gray-500">
                                <p>Location: {emergency.location?.address || 'Unknown'}</p>
                            </div>
                        </div>

                        {/* Chat Box */}
                        <ChatBox emergencyId={id} currentUser={user} />

                    </div>
                </div>
            </div>
            {/* Review Modal */}
            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSubmit={submitReview}
                emergency={emergency}
            />
        </div>
    );
};

export default EmergencyTracking;
