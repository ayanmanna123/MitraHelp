import { useState } from 'react';
import EmergencyImageGallery from '../components/shared/EmergencyImageGallery';
import { FaImage, FaFilter, FaRedo } from 'react-icons/fa';

const EmergencyImageGalleryPage = () => {
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const emergencyTypes = [
        { value: '', label: 'All Types' },
        { value: 'Medical', label: 'Medical' },
        { value: 'Accident', label: 'Accident' },
        { value: 'Blood', label: 'Blood Donation' },
        { value: 'Disaster', label: 'Natural Disaster' },
        { value: 'Other', label: 'Other' }
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'Searching', label: 'Searching' },
        { value: 'Accepted', label: 'Accepted' },
        { value: 'On The Way', label: 'On The Way' },
        { value: 'Arrived', label: 'Arrived' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled', label: 'Cancelled' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                        <FaImage className="text-red-500" />
                        Emergency Image Gallery
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        View all emergency images uploaded by users. These images help volunteers understand 
                        the situation and provide better assistance.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaFilter className="text-blue-500" />
                        Filter Images
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Emergency Type
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {emergencyTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {statusOptions.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => {
                                setFilterType('');
                                setFilterStatus('');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            <FaRedo />
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* Gallery */}
                <div className="bg-white rounded-lg shadow p-6">
                    <EmergencyImageGallery 
                        fetchAllImages={true}
                        emergencyTitle="Emergency Images"
                    />
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">About This Gallery</h3>
                    <div className="text-blue-700 space-y-2">
                        <p>• All images are from real emergency situations reported by users</p>
                        <p>• Images help volunteers assess the urgency and nature of each emergency</p>
                        <p>• Only emergencies with uploaded images are displayed here</p>
                        <p>• Images are sorted by most recent first</p>
                        <p>• Click on any image to view it in fullscreen mode</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyImageGalleryPage;