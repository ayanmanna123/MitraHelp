import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaCamera, FaPlus, FaTrash, FaMapMarkerAlt, FaClock, FaUserMd, FaCarCrash, FaTint, FaExclamationTriangle, FaEllipsisH, FaLocationArrow, FaImage, FaAmbulance } from 'react-icons/fa';

const EmergencyWithImages = ({ emergencyType }) => {
    const { user, getCurrentLocation } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [description, setDescription] = useState('');
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length + images.length > 5) {
            toast.error('You can upload maximum 5 images');
            return;
        }

        const newImages = [];
        const newPreviewUrls = [];

        files.forEach(file => {
            if (!file.type.match('image.*')) {
                toast.error('Please select only image files');
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size should be less than 5MB');
                return;
            }

            newImages.push(file);

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            newPreviewUrls.push(previewUrl);
        });

        setImages(prev => [...prev, ...newImages]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const removeImage = (index) => {
        // Remove the image from both arrays
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviewUrls = [...previewUrls];
        // Revoke the object URL to free up memory
        URL.revokeObjectURL(newPreviewUrls[index]);
        newPreviewUrls.splice(index, 1);
        setPreviewUrls(newPreviewUrls);
    };

    const handleRequestHelp = async () => {
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

        if (!description.trim()) {
            toast.error('Please provide a description of the emergency');
            return;
        }

        setLoading(true);
        try {
            // Create form data to send both text and image data
            const formData = new FormData();

            // Add text fields
            formData.append('type', emergencyType);
            formData.append('description', description);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);
            formData.append('address', user?.location?.address || `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

            // Add images if any
            images.forEach((image, index) => {
                formData.append('images', image);
            });

            // Create the emergency with images
            const emergencyResponse = await api.post('/emergency', formData);

            if (!emergencyResponse.data.success) {
                throw new Error(emergencyResponse.data.message || 'Failed to create emergency');
            }

            const emergencyId = emergencyResponse.data.data._id;

            toast.success('Emergency request sent! Volunteers are being notified.');

            // Navigate to the emergency tracking page
            navigate(`/emergency/${emergencyId}`);

        } catch (error) {
            console.error('Error creating emergency:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to create emergency request';
            toast.error(`Emergency Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Create Emergency Request</h2>
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                    Emergency Type: <span className="text-red-600">{emergencyType}</span>
                </label>
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                    Describe the emergency *
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder={`Describe your ${emergencyType} emergency in detail...`}
                    disabled={loading}
                />
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                    Add Images (Optional, up to 5)
                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                    <button
                        type="button"
                        onClick={triggerFileSelect}
                        disabled={loading || images.length >= 5}
                        className={`flex items-center justify-center gap-2 w-full p-4 rounded-lg ${images.length >= 5
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                            }`}
                    >
                        <FaCamera className="text-xl" />
                        <span>{images.length > 0 ? `Add More Images (${5 - images.length} left)` : 'Click to add images'}</span>
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={loading || images.length >= 5}
                    />

                    <p className="text-sm text-gray-500 mt-2">
                        PNG, JPG, JPEG (Max 5MB each, Max 5 images)
                    </p>
                </div>

                {previewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {previewUrls.map((url, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <FaTrash className="text-xs" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                                    Image {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
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

                <button
                    onClick={handleRequestHelp}
                    disabled={loading || !description.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                        </>
                    ) : (
                        <>
                            <FaAmbulance />
                            Send Emergency Request
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default EmergencyWithImages;