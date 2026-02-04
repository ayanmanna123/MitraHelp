import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUserShield, FaArrowRight, FaAmbulance, FaLocationArrow, FaExclamationTriangle, FaHome, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const UserDashboard = () => {
    const { user, logout, getCurrentLocation } = useAuth();
    const navigate = useNavigate();
    const [volunteerProgress, setVolunteerProgress] = useState(null);
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [activeEmergencies, setActiveEmergencies] = useState([]);
    const [loadingEmergencies, setLoadingEmergencies] = useState(false);
    const [editingAddress, setEditingAddress] = useState(false);
    const [permanentAddress, setPermanentAddress] = useState(user?.permanentAddress?.address || '');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    useEffect(() => {
        if (user?.role === 'volunteer' || user?.role === 'user') {
            fetchVolunteerProgress(); // Keep this in case they are applying
            fetchActiveEmergencies();
            setPermanentAddress(user?.permanentAddress?.address || '');
        }
    }, [user]);

    const fetchActiveEmergencies = async () => {
        setLoadingEmergencies(true);
        try {
            const response = await api.get('/emergency/user');
            if (response.data.success) {
                // Filter for active (not completed) emergencies
                const active = response.data.data.filter(em => 
                    em.status !== 'Completed'
                );
                setActiveEmergencies(active);
            }
        } catch (error) {
            console.error('Error fetching emergencies:', error);
        } finally {
            setLoadingEmergencies(false);
        }
    };

    const updatePermanentAddress = async () => {
        if (!permanentAddress.trim()) {
            toast.error('Please enter a valid address');
            return;
        }

        setUpdatingProfile(true);
        try {
            const response = await api.put('/users/profile', {
                permanentAddress: {
                    address: permanentAddress.trim()
                }
            });
            
            if (response.data.success) {
                toast.success('Permanent address updated successfully');
                setEditingAddress(false);
                // Update auth context if needed
            }
        } catch (error) {
            console.error('Error updating address:', error);
            toast.error(error.response?.data?.message || 'Failed to update address');
        } finally {
            setUpdatingProfile(false);
        }
    };

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
                <h1 className="text-xl font-bold text-red-600">MitraHelp User</h1>
                <div className="flex items-center gap-4">
                    <button onClick={logout} className="text-gray-600 hover:text-red-600 font-medium">
                        Logout
                    </button>
                </div>
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

                    {/* Volunteer Application Status / Upsell - Removed as requested */}
                    {user?.volunteerStatus === 'not_applied' && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-blue-800">Become a Volunteer</h3>
                                    <p className="text-blue-700 text-sm mt-1">Help your community by joining our volunteer network.</p>
                                </div>
                                <Link to="/volunteer-signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                    Apply Now
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Show Progress if they started applying but are still on User dashboard */}
                    {user?.volunteerStatus !== 'approved' && user?.volunteerStatus !== 'not_applied' && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-blue-800">Volunteer Application Pending</h3>
                                <Link to="/volunteer-profile" className="text-blue-600 hover:text-blue-800 flex items-center">
                                    Check Status <FaArrowRight className="ml-1 text-sm" />
                                </Link>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                                    style={{ width: `${volunteerProgress?.percentage || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-red-500" /> Current Location
                                </h3>
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
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                    <FaLocationArrow className={`text-xs ${updatingLocation ? 'animate-spin' : ''}`} />
                                    {updatingLocation ? 'Updating...' : 'Refresh'}
                                </button>
                            </div>
                            <p className="text-gray-600">
                                {user?.location?.coordinates
                                    ? `${user.location.coordinates[1].toFixed(4)}, ${user.location.coordinates[0].toFixed(4)}`
                                    : 'Location not set'}
                            </p>
                            {user?.location?.address && (
                                <p className="text-sm text-gray-500 mt-1 truncate">
                                    {user.location.address}
                                </p>
                            )}
                        </div>
                        
                        {/* Permanent Address Section */}
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FaHome className="text-green-500" /> Permanent Address
                                </h3>
                                {!editingAddress ? (
                                    <button
                                        onClick={() => setEditingAddress(true)}
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <FaEdit className="text-xs" />
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={updatePermanentAddress}
                                            disabled={updatingProfile}
                                            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 disabled:opacity-50"
                                        >
                                            <FaSave className="text-xs" />
                                            {updatingProfile ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingAddress(false);
                                                setPermanentAddress(user?.permanentAddress?.address || '');
                                            }}
                                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                                        >
                                            <FaTimes className="text-xs" />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {editingAddress ? (
                                <input
                                    type="text"
                                    value={permanentAddress}
                                    onChange={(e) => setPermanentAddress(e.target.value)}
                                    placeholder="Enter your permanent address"
                                    className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                />
                            ) : (
                                <p className="text-gray-600 truncate">
                                    {user?.permanentAddress?.address || 'Not set'}
                                </p>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">
                                Used for emergency notifications when you're not at your current location
                            </p>
                        </div>
                        
                        {/* Face Verification Section */}
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FaUserShield className="text-purple-500" /> Identity Verification
                                </h3>
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-3">
                                    Verify your identity with government ID and selfie
                                </p>
                                
                                <Link 
                                    to="/face-verification" 
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm inline-flex items-center gap-2"
                                >
                                    Verify Identity
                                    <FaArrowRight className="text-xs" />
                                </Link>
                        </div>
                    </div>
                </div>

                {/* Active Emergencies Section */}
                {activeEmergencies.length > 0 && (
                    <div className="mb-8 bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FaExclamationTriangle className="text-yellow-500" />
                                Active Emergencies
                            </h2>
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                {activeEmergencies.length} ongoing
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            {activeEmergencies.map((emergency) => (
                                <div 
                                    key={emergency._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                                    onClick={() => navigate(`/emergency/${emergency._id}`)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{emergency.type} Emergency</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                {emergency.description || 'No description provided'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                    {emergency.status}
                                                </span>
                                                {emergency.assignedVolunteer && (
                                                    <span className="text-xs text-gray-500">
                                                        Volunteer: {emergency.assignedVolunteer.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <FaArrowRight className="text-gray-400 mt-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-1 gap-6">
                    <div 
                        className="bg-red-50 border border-red-100 p-6 rounded-xl hover:shadow-md transition cursor-pointer hover:bg-red-100"
                        onClick={() => navigate('/need-help')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-3 rounded-full">
                                <FaAmbulance className="text-red-600 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-red-800 mb-1">Request Emergency Help</h3>
                                <p className="text-red-600">Get immediate assistance from nearby volunteers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;
