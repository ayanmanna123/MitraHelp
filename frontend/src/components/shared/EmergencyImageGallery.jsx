import { useState } from 'react';
import { FaImage, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const EmergencyImageGallery = ({ images = [], emergencyTitle = "Emergency" }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const openImage = (index) => {
        setCurrentImageIndex(index);
        setIsFullscreen(true);
    };

    const closeGallery = () => {
        setCurrentImageIndex(null);
        setIsFullscreen(false);
    };

    const nextImage = () => {
        if (currentImageIndex !== null && images.length > 0) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === images.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const prevImage = () => {
        if (currentImageIndex !== null && images.length > 0) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === 0 ? images.length - 1 : prevIndex - 1
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

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaImage className="text-red-500" /> Emergency Images
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((imgUrl, index) => {
                    // Handle URL formatting
                    const getFullUrl = (url) => {
                        if (!url) return '';
                        if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
                        // Use the Vite environment variable for API URL or default
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                        // Remove /api suffix if present to get base URL
                        const baseUrl = apiUrl.replace('/api', '');
                        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
                    };

                    const finalUrl = getFullUrl(imgUrl);

                    return (
                        <div
                            key={index}
                            className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-gray-100"
                            onClick={() => openImage(index)}
                        >
                            <img
                                src={finalUrl}
                                alt={`${emergencyTitle} image ${index + 1}`}
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                    e.target.onerror = null; // Prevent loop
                                    e.target.style.display = 'none'; // Hide broken image
                                    e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                    const fallback = document.createElement('div');
                                    fallback.className = 'text-gray-400 text-3xl';
                                    fallback.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48zM112 120c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56zM64 384h384V272l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L208 320l-55.515-55.515c-4.686-4.686-12.284-4.686-16.971 0L64 336v48z"></path></svg>';
                                    e.target.parentElement.appendChild(fallback);
                                }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                    View Image
                                </span>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Fullscreen Gallery */}
            {isFullscreen && currentImageIndex !== null && (
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
                                src={images[currentImageIndex]}
                                alt={`${emergencyTitle} image ${currentImageIndex + 1}`}
                                className="max-h-[80vh] max-w-[90vw] object-contain"
                                onError={(e) => {
                                    e.target.src = '/placeholder-image.jpg';
                                    e.target.alt = 'Image not available';
                                }}
                            />
                        </div>

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                            {currentImageIndex + 1} of {images.length} - {emergencyTitle}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyImageGallery;