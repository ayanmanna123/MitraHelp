import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapComponent from '../components/map/MapComponent';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import { toast } from 'react-hot-toast';
import { FaPhoneAlt, FaUserShield, FaAmbulance } from 'react-icons/fa';

const EmergencyTracking = () => {
    const { id } = useParams();
    const [emergency, setEmergency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [volunteerLocation, setVolunteerLocation] = useState(null);
    const socket = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();

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

    useEffect(() => {
        fetchEmergency();
    }, [id]);

    useEffect(() => {
        if (socket) {
            socket.on('status_update', (data) => {
                if (data.emergencyId === id) {
                    setEmergency(prev => ({ ...prev, status: data.status }));
                    toast.success(`Status updated: ${data.status}`);
                    fetchEmergency(); // Refresh to get latest data (e.g. assigned volunteer)
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

            // Listen for live location updates
            socket.on('remote_location_update', (data) => {
                if (data.emergencyId === id && data.role === 'volunteer') {
                    // Update volunteer location marker
                    setVolunteerLocation([data.longitude, data.latitude]); // GeoJSON format [lng, lat]
                }
            });
        }
    }, [socket, id]);

    // Live Location Tracking
    useEffect(() => {
        if (!emergency || !socket || !user) return;

        // If I am the assigned volunteer, broadcast my location
        const isAssignedVolunteer = emergency.assignedVolunteer?._id === user._id ||
            (emergency.assignedVolunteer && emergency.assignedVolunteer === user._id); // Check both populated and unpopulated ID

        if (isAssignedVolunteer && emergency.status !== 'Completed') {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, heading } = position.coords;
                    socket.emit('location_update', {
                        emergencyId: id,
                        userId: user._id,
                        role: 'volunteer',
                        latitude,
                        longitude,
                        heading
                    });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [emergency, socket, user, id]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!emergency) return <div className="p-8 text-center">Emergency not found</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Searching': return 'text-yellow-600 bg-yellow-100';
            case 'Accepted': return 'text-blue-600 bg-blue-100';
            case 'On The Way': return 'text-purple-600 bg-purple-100';
            case 'Completed': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const markers = [];
    // Requester Marker
    if (emergency.location) {
        markers.push({
            position: emergency.location.coordinates.slice().reverse(), // [lat, lng]
            popupText: 'Emergency Location'
        });
    }
    // Volunteer Marker - Use live location if available, else static
    const volLoc = volunteerLocation || emergency.assignedVolunteer?.location?.coordinates;
    if (volLoc) {
        markers.push({
            position: [volLoc[1], volLoc[0]], // [lat, lng]
            popupText: `Volunteer: ${emergency.assignedVolunteer?.name || 'Volunteer'}`
        });
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Header Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FaAmbulance className="text-red-600" />
                            {emergency.type} Emergency
                        </h1>
                        <p className="text-gray-500 text-sm">ID: {emergency._id}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-lg ${getStatusColor(emergency.status)}`}>
                        {emergency.status}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {/* Main Map Area */}
                    <div className="md:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <MapComponent
                            initialLocation={emergency.location.coordinates.slice().reverse()}
                            readOnly={true}
                            markers={markers}
                            height="400px"
                        />
                    </div>

                    {/* Info Sidebar */}
                    <div className="space-y-4">
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

                                    <a href={`tel:${emergency.assignedVolunteer.phone}`} className="block w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2">
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

                        {/* Description Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold text-gray-700 mb-2">Details</h2>
                            <p className="text-gray-600 italic">
                                "{emergency.description || 'No description provided'}"
                            </p>
                        </div>

                        {/* Chat Box */}
                        <ChatBox emergencyId={id} currentUser={user} />

                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyTracking;
