import { FaTimes, FaMapMarkerAlt, FaUser, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import EmergencyImageGallery from './EmergencyImageGallery';

const EmergencyDetailModal = ({ emergency, onClose, onAccept }) => {
    if (!emergency) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-fade-in">
                {/* Header */}
                <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-start sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <FaExclamationCircle className="text-red-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {emergency.type} Emergency
                            </h2>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <FaClock size={12} />
                                {new Date(emergency.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Key Info Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Requester</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                    <FaUser />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{emergency.requester?.name || 'Unknown User'}</p>
                                    <p className="text-xs text-gray-500">In need of help</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Location</h3>
                            <div className="flex items-start gap-2 text-gray-700">
                                <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                                <span className="font-medium">
                                    {emergency.location?.address || 'Location details unavailable'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 text-gray-700 italic">
                            "{emergency.description || 'No additional description provided.'}"
                        </div>
                    </div>

                    {/* Images */}
                    {emergency.images && emergency.images.length > 0 && (
                        <div>
                            <EmergencyImageGallery
                                images={emergency.images}
                                emergencyTitle={`${emergency.type} - ${emergency.requester?.name}`}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => onAccept(emergency._id)}
                        className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        <FaCheckCircle /> Accept Emergency
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyDetailModal;
