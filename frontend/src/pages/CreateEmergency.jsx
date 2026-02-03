import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/map/MapComponent';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const CreateEmergency = () => {
    const [type, setType] = useState('Medical');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            toast.error('Please select a location on the map');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/emergency', {
                type,
                description,
                latitude: location.lat,
                longitude: location.lng
            });

            if (data.success) {
                toast.success('Help request sent! Notifying volunteers...');
                navigate('/dashboard'); // TODO: Navigate to tracking page
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to request help');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-red-600 p-6 text-white text-center">
                    <h1 className="text-3xl font-bold">Request Emergency Help</h1>
                    <p className="opacity-90 mt-2">Nearby volunteers will be notified immediately</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                        >
                            <option value="Medical">Medical Emergency</option>
                            <option value="Accident">Road Accident</option>
                            <option value="Blood">Blood Needed</option>
                            <option value="Disaster">Natural Disaster</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="Briefly describe the situation..."
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Location <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden">
                            <MapComponent
                                onLocationSelect={setLocation}
                                height="300px"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Tap on the map to pin-point exact location
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white transition shadow-lg
                            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 animate-pulse-slow'}
                        `}
                    >
                        {loading ? 'Sending Request...' : '🚨 REQUEST HELP NOW'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateEmergency;
