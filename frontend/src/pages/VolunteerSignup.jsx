import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaUser, FaIdCard, FaCamera, FaShieldAlt, FaArrowLeft, FaHome, FaMapMarkerAlt, FaCrosshairs, FaSpinner } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const VolunteerSignup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Personal Info, 2: Document Upload, 3: Review
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        permanentAddress: '',
        latitude: null,
        longitude: null,
        governmentId: null,
        selfie: null
    });
    const [showMap, setShowMap] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]); // Default to Kolkata
    const [uploading, setUploading] = useState({
        governmentId: false,
        selfie: false
    });

    const handleInputChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setMapCenter([latitude, longitude]);
                setFormData(prev => ({
                    ...prev,
                    latitude,
                    longitude
                }));
                
                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    if (data.display_name) {
                        setFormData(prev => ({
                            ...prev,
                            permanentAddress: data.display_name
                        }));
                    }
                } catch (error) {
                    console.error('Error reverse geocoding:', error);
                }
                
                setGettingLocation(false);
                setShowMap(true);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please enter address manually.');
                setGettingLocation(false);
            }
        );
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                [type]: file
            }));
        }
    };

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            // Update profile with all data including coordinates
            if (formData.name || formData.email || formData.permanentAddress || formData.latitude) {
                const profileData = {};
                if (formData.name) profileData.name = formData.name;
                if (formData.email) profileData.email = formData.email;
                if (formData.permanentAddress || formData.latitude) {
                    profileData.permanentAddress = {
                        address: formData.permanentAddress || 'Address not specified'
                    };
                    if (formData.latitude && formData.longitude) {
                        profileData.permanentAddress.latitude = formData.latitude;
                        profileData.permanentAddress.longitude = formData.longitude;
                    }
                }
                
                const profileResponse = await api.put('/auth/profile', profileData);
                console.log('Profile update response:', profileResponse.data);
            }

            // Upload documents
            if (formData.governmentId || formData.selfie) {
                const uploadFormData = new FormData();

                if (formData.governmentId) {
                    uploadFormData.append('governmentId', formData.governmentId);
                }

                if (formData.selfie) {
                    uploadFormData.append('selfie', formData.selfie);
                }

                const registerResponse = await api.post('/volunteer/register', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('Register response:', registerResponse.data);
            }

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'Error completing signup. Please try again.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            
            alert(errorMessage);
        }
    };

    const isStep1Valid = formData.name && formData.email && formData.permanentAddress && formData.latitude && formData.longitude;

    // Map component
    const MapSelector = () => {
        const [markerPosition, setMarkerPosition] = useState(mapCenter);
        
        useEffect(() => {
            if (!showMap) return;
            
            // Initialize map
            const map = L.map('map').setView(mapCenter, 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Add marker
            const marker = L.marker(mapCenter, { draggable: true }).addTo(map);
            
            // Update marker position on drag
            marker.on('dragend', async function(e) {
                const newPosition = e.target.getLatLng();
                setMarkerPosition([newPosition.lat, newPosition.lng]);
                
                // Reverse geocode
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}`
                    );
                    const data = await response.json();
                    setFormData(prev => ({
                        ...prev,
                        latitude: newPosition.lat,
                        longitude: newPosition.lng,
                        permanentAddress: data.display_name || `Location: ${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`
                    }));
                } catch (error) {
                    console.error('Error reverse geocoding:', error);
                    setFormData(prev => ({
                        ...prev,
                        latitude: newPosition.lat,
                        longitude: newPosition.lng,
                        permanentAddress: `Location: ${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`
                    }));
                }
            });
            
            // Cleanup
            return () => {
                map.remove();
            };
        }, [showMap, mapCenter]);
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Select Your Permanent Address Location</h3>
                        <button 
                            onClick={() => setShowMap(false)}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    <div className="flex-1 relative">
                        <div id="map" className="w-full h-full min-h-[400px]"></div>
                        <div className="absolute top-4 left-4 bg-white p-2 rounded shadow text-sm">
                            <div>Lat: {markerPosition[0].toFixed(6)}</div>
                            <div>Lng: {markerPosition[1].toFixed(6)}</div>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                        <div className="text-center mb-3">
                            <p className="text-sm text-gray-600">Drag the marker to your exact location</p>
                            <p className="text-xs text-gray-500 mt-1">Address will be automatically updated</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowMap(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowMap(false)}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const isStep2Valid = formData.governmentId && formData.selfie;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4">
                <div className="container mx-auto flex items-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center text-gray-600 hover:text-red-600 mr-4"
                    >
                        <FaArrowLeft className="mr-2" /> Back
                    </button>
                    <h1 className="text-xl font-bold text-red-600">Volunteer Signup</h1>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3].map((num) => (
                            <div key={num} className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= num ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
                                    }`}>
                                    {num}
                                </div>
                                <span className="text-xs mt-2 text-gray-600">
                                    {num === 1 ? 'Personal Info' : num === 2 ? 'Documents' : 'Review'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step 1: Personal Information */}
                {step === 1 && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address *</label>
                                
                                {/* Map Button */}
                                <div className="mb-3">
                                    <button
                                        type="button"
                                        onClick={getCurrentLocation}
                                        disabled={gettingLocation}
                                        className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {gettingLocation ? (
                                            <>
                                                <FaSpinner className="animate-spin text-red-500" />
                                                <span className="text-gray-600">Getting your location...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaMapMarkerAlt className="text-red-500" />
                                                <span className="text-gray-700 font-medium">Select on Map</span>
                                                <span className="text-gray-500 text-sm ml-auto">or enter manually below</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Manual Address Input */}
                                <div className="relative mb-2">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaHome className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="permanentAddress"
                                        value={formData.permanentAddress}
                                        onChange={handleInputChange}
                                        className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder="Enter your permanent/home address"
                                        required
                                    />
                                </div>
                                
                                {/* Coordinates Display */}
                                {(formData.latitude && formData.longitude) && (
                                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                                        <div className="flex items-center gap-1">
                                            <FaCrosshairs className="text-green-500" />
                                            <span>Selected Location:</span>
                                        </div>
                                        <div className="ml-5 mt-1">
                                            <div>Lat: {formData.latitude.toFixed(6)}</div>
                                            <div>Lng: {formData.longitude.toFixed(6)}</div>
                                        </div>
                                    </div>
                                )}
                                
                                <p className="text-xs text-gray-500 mt-1">This helps us notify you about emergencies in your area even when you're away</p>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="flex items-start">
                                    <FaUser className="text-blue-500 text-xl mt-0.5 mr-3" />
                                    <div>
                                        <h3 className="font-medium text-blue-800">Why we need this info</h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                            This information helps us verify your identity, contact you about volunteer opportunities, and notify you about emergencies near your permanent address.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleNext}
                                disabled={!isStep1Valid}
                                className={`px-6 py-3 rounded-lg font-medium ${isStep1Valid
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Next: Upload Documents
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Document Upload */}
                {step === 2 && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Document Verification</h2>
                        <p className="text-gray-600 mb-6">Upload clear images of your government ID and a selfie for verification.</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Government ID */}
                            <div className="border-2 border-dashed rounded-lg p-6">
                                <div className="text-center">
                                    <FaIdCard className="text-3xl text-gray-400 mx-auto mb-3" />
                                    <h3 className="font-semibold mb-2">Government ID</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Upload a clear photo of your government-issued ID (Aadhaar, Passport, Driver's License)
                                    </p>

                                    {!formData.governmentId ? (
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'governmentId')}
                                                className="mb-3 w-full"
                                            />
                                            <button
                                                onClick={() => document.querySelector('input[type="file"]').click()}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                            >
                                                Select File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <FaShieldAlt className="text-green-500 text-2xl mx-auto mb-2" />
                                            <p className="text-green-600 font-medium">Selected</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selfie */}
                            <div className="border-2 border-dashed rounded-lg p-6">
                                <div className="text-center">
                                    <FaCamera className="text-3xl text-gray-400 mx-auto mb-3" />
                                    <h3 className="font-semibold mb-2">Selfie</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Upload a clear selfie holding your ID for verification
                                    </p>

                                    {!formData.selfie ? (
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'selfie')}
                                                className="mb-3 w-full"
                                            />
                                            <button
                                                onClick={() => {
                                                    const inputs = document.querySelectorAll('input[type="file"]');
                                                    inputs[1].click();
                                                }}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                            >
                                                Select File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <FaUser className="text-green-500 text-2xl mx-auto mb-2" />
                                            <p className="text-green-600 font-medium">Selected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!isStep2Valid}
                                className={`px-6 py-3 rounded-lg font-medium ${isStep2Valid
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Next: Review
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Your Information</h2>

                        <div className="space-y-6">
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-700 mb-3">Personal Information</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="font-medium">{formData.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="font-medium">{formData.email}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Permanent Address</p>
                                        <p className="font-medium">{formData.permanentAddress}</p>
                                        {formData.latitude && formData.longitude && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-700 mb-3">Documents</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Government ID</p>
                                        <p className="font-medium">{formData.governmentId ? '✓ Uploaded' : 'Not uploaded'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Selfie</p>
                                        <p className="font-medium">{formData.selfie ? '✓ Uploaded' : 'Not uploaded'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <div className="flex items-start">
                                    <FaShieldAlt className="text-yellow-500 text-xl mt-0.5 mr-3" />
                                    <div>
                                        <h3 className="font-medium text-yellow-800">Next Steps</h3>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            After submitting, your application will be reviewed by our team. You'll receive an update via email within 24-48 hours.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                            >
                                Complete Signup
                            </button>
                        </div>
                    </div>
                )}
            </main>
            
            {/* Map Modal */}
            {showMap && <MapSelector />}
        </div>
    );
};

export default VolunteerSignup;
