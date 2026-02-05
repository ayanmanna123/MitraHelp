import { useState, useEffect } from 'react';
import { FaImage, FaTimes, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import api from '../../services/api';

const EmergencyImageGallery = ({ images = [], emergencyTitle = "Emergency", fetchAllImages = false }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [allImages, setAllImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [errorIndices, setErrorIndices] = useState({});

    // Fetch all images from backend if fetchAllImages is true
    useEffect(() => {
        if (fetchAllImages) {
            fetchAllEmergencyImages();
        } else {
            // Use provided images
            const mappedImages = images.map((img, index) => ({
                url: img,
                emergencyType: emergencyTitle,
                description: `Image ${index + 1}`
            }));
            setAllImages(mappedImages);
        }
    }, [fetchAllImages, images, emergencyTitle]);

    const fetchAllEmergencyImages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/emergency/all');
            if (response.data.success) {
                setAllImages(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching emergency images:', err);
            setError('Failed to load emergency images');
        } finally {
            setLoading(false);
        }
    };

    // Helper to format URLs
    const getFullUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;

        // Use the Vite environment variable for API URL or default
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        // Remove /api suffix if present to get base URL
        const baseUrl = apiUrl.replace('/api', '');

        // Normalize path (handle Windows backslashes)
        let cleanUrl = url.replace(/\\/g, '/');

        // Handle potential absolute paths by stripping everything before 'uploads/'
        if (cleanUrl.includes('uploads/')) {
            cleanUrl = cleanUrl.substring(cleanUrl.indexOf('uploads/'));
        }

        // Ensure regular paths that don't start with uploads (and are likely local filenames) get mapped correctly if needed
        // But for now, just fix the absolute path issue.

        const finalUrl = `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
        return finalUrl;
    };

    const openImage = (index) => {
        setCurrentImageIndex(index);
        setIsFullscreen(true);
    };

    const closeGallery = () => {
        setCurrentImageIndex(null);
        setIsFullscreen(false);
    };

    const nextImage = () => {
        if (currentImageIndex !== null && allImages.length > 0) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const prevImage = () => {
        if (currentImageIndex !== null && allImages.length > 0) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
            );
        }
    };

    const handleKeyDown = (e) => {
        if (!isFullscreen) return;

        if (e.key === 'Escape') {
            closeGallery();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="mt-6 text-center py-8">
                <FaSpinner className="animate-spin text-blue-500 text-2xl mx-auto mb-2" />
                <p className="text-gray-600">Loading emergency images...</p>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="mt-6 text-center py-8">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                    onClick={fetchAllEmergencyImages}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Show empty state
    if (!allImages || allImages.length === 0) {
        return (
            <div className="mt-6 text-center py-8">
                <FaImage className="text-gray-400 text-3xl mx-auto mb-2" />
                <p className="text-gray-500">No emergency images available</p>
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaImage className="text-red-500" /> Emergency Images
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allImages.map((imageData, index) => {
                    const finalUrl = getFullUrl(imageData.url);
                    const isError = errorIndices[index];

                    return (
                        <div
                            key={index}
                            className={`relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-gray-100 ${isError ? 'flex items-center justify-center' : ''}`}
                            onClick={() => openImage(index)}
                        >
                            {!isError ? (
                                <img
                                    src={finalUrl}
                                    alt={`${imageData.emergencyType || emergencyTitle} image ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                    onError={() => setErrorIndices(prev => ({ ...prev, [index]: true }))}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 w-full text-gray-400">
                                    <FaImage className="text-3xl mb-1" />
                                    <span className="text-xs">Image {index + 1}</span>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                    View Image
                                </span>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                            </div>
                            {/* Image info overlay */}
                            <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded truncate max-w-[80%]">
                                {imageData.emergencyType}
                            </div>
                            {/* External Link for Debugging */}
                            <a
                                href={finalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-1 right-1 bg-white bg-opacity-75 hover:bg-opacity-100 p-1 rounded-full text-blue-600 z-10 transition-all"
                                onClick={(e) => e.stopPropagation()}
                                title="Open original image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    );
                })}
            </div>

            {/* Fullscreen Gallery */}
            {
                isFullscreen && currentImageIndex !== null && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                        onClick={closeGallery}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                    >
                        <div
                            className="relative max-w-6xl max-h-full w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeGallery}
                                className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300"
                            >
                                <FaTimes />
                            </button>

                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-10 hover:text-gray-300"
                            >
                                <FaChevronLeft />
                            </button>

                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-10 hover:text-gray-300"
                            >
                                <FaChevronRight />
                            </button>

                            <div className="flex items-center justify-center h-full">
                                <img
                                    src={getFullUrl(allImages[currentImageIndex]?.url)}
                                    alt={`${allImages[currentImageIndex]?.emergencyType || emergencyTitle} image ${currentImageIndex + 1}`}
                                    className="max-h-[80vh] max-w-[90vw] object-contain"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-image.jpg';
                                        e.target.alt = 'Image not available';
                                    }}
                                />
                            </div>

                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm text-center">
                                <div>{currentImageIndex + 1} of {allImages.length}</div>
                                <div className="text-xs mt-1">
                                    {allImages[currentImageIndex]?.emergencyType} - {allImages[currentImageIndex]?.requester}
                                </div>
                                {allImages[currentImageIndex]?.description && (
                                    <div className="text-xs mt-1 max-w-md">
                                        {allImages[currentImageIndex]?.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default EmergencyImageGallery;