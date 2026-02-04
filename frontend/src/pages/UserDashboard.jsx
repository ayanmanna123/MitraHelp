import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUserShield, FaArrowRight, FaAmbulance, FaLocationArrow, FaExclamationTriangle, FaHome, FaEdit, FaSave, FaTimes, FaAddressBook, FaPlus, FaTrash, FaEnvelope, FaUser, FaHeart } from 'react-icons/fa';
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

    // Emergency Contacts State
    const [newContact, setNewContact] = useState({ name: '', email: '', relation: 'Family' });
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);
    const [contacts, setContacts] = useState(user?.emergencyContacts || []);

    useEffect(() => {
        if (user?.role === 'volunteer' || user?.role === 'user') {
            fetchVolunteerProgress();
            fetchActiveEmergencies();
            setPermanentAddress(user?.permanentAddress?.address || '');
        }
        if (user?.emergencyContacts) {
            setContacts(user.emergencyContacts);
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

    const handleAddContact = async (e) => {
        e.preventDefault();
        if (!newContact.name || !newContact.email) {
            toast.error('Name and Email are required');
            return;
        }
        setContactLoading(true);
        try {
            const response = await api.post('/users/emergency-contacts', newContact);
            if (response.data.success) {
                toast.success('Contact added successfully');
                setContacts(response.data.data);
                setIsAddingContact(false);
                setNewContact({ name: '', email: '', relation: 'Family' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add contact');
        } finally {
            setContactLoading(false);
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (!window.confirm('Are you sure you want to remove this contact?')) return;
        try {
            const response = await api.delete(`/users/emergency-contacts/${contactId}`);
            if (response.data.success) {
                toast.success('Contact removed');
                setContacts(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to remove contact');
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

                    {/* Volunteer Application Status */}
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

                    {/* Application Pending Status */}
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

                    {/* Emergency Contacts Section */}
                    <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <FaAddressBook className="text-blue-500" /> Emergency Contacts
                            </h3>
                            {!isAddingContact && (
                                <button
                                    onClick={() => setIsAddingContact(true)}
                                    className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 font-medium"
                                >
                                    <FaPlus className="text-xs" /> Add Contact
                                </button>
                            )}
                        </div>

                        {isAddingContact && (
                            <form onSubmit={handleAddContact} className="mb-4 bg-gray-50 p-4 rounded-lg border border-blue-100">
                                <div className="grid md:grid-cols-3 gap-3 mb-3">
                                    <div className="relative">
                                        <FaUser className="absolute left-3 top-3 text-gray-400 text-sm" />
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={newContact.name}
                                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                            className="w-full pl-9 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3 top-3 text-gray-400 text-sm" />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={newContact.email}
                                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                            className="w-full pl-9 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <FaHeart className="absolute left-3 top-3 text-gray-400 text-sm" />
                                        <select
                                            value={newContact.relation}
                                            onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                                            className="w-full pl-9 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="Family">Family</option>
                                            <option value="Friend">Friend</option>
                                            <option value="Colleague">Colleague</option>
                                            <option value="Doctor">Doctor</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingContact(false)}
                                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={contactLoading}
                                        className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {contactLoading ? 'Saving...' : 'Save Contact'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {contacts.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded border border-dashed">
                                No emergency contacts added yet. Add trusted contacts to notify them in emergencies.
                            </p>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-3">
                                {contacts.map((contact) => (
                                    <div key={contact._id} className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-200 transition bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {contact.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{contact.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <span className="bg-gray-200 px-1.5 rounded-[3px] text-[10px]">{contact.relation}</span>
                                                    {contact.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteContact(contact._id)}
                                            className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                                            title="Remove contact"
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <FaExclamationTriangle />
                            Note: These contacts will be notified immediately via Email when you report an emergency.
                        </div>
                    </div>

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
