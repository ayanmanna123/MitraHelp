import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/map/MapComponent';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import useVoice from '../hooks/useVoice';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

const CreateEmergency = () => {
    const [type, setType] = useState('Medical');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { isListening, transcript, startListening, stopListening, resetTranscript, error } = useVoice();

    // Effect to process voice transcript
    useEffect(() => {
        if (transcript) {
            setDescription(transcript);

            const lowerTranscript = transcript.toLowerCase();
            if (lowerTranscript.includes('medical') || lowerTranscript.includes('ambulance') || lowerTranscript.includes('hurt') || lowerTranscript.includes('pain')) {
                setType('Medical');
            } else if (lowerTranscript.includes('accident') || lowerTranscript.includes('crash') || lowerTranscript.includes('collision')) {
                setType('Accident');
            } else if (lowerTranscript.includes('fire') || lowerTranscript.includes('burn') || lowerTranscript.includes('smoke')) {
                setType('Disaster'); // Assuming Fire falls under disaster or we can add Fire type
            } else if (lowerTranscript.includes('blood')) {
                setType('Blood');
            } else if (lowerTranscript.includes('flood') || lowerTranscript.includes('earthquake')) {
                setType('Disaster');
            }

            // Voice command to submit "Send Help"
            if (lowerTranscript.includes('send self') || lowerTranscript.includes('send help') || lowerTranscript.includes('submit')) {
                // Trigger submit only if location is set? 
                // It's risky to auto-submit without location check via voice, but let's just toast for now or trigger form submission logic
                if (location) {
                    handleSubmit(new Event('submit'));
                } else {
                    toast.error('Please select a location on the map first.');
                }
            }
        }
    }, [transcript]);

    const toggleVoice = () => {
        if (isListening) {
            stopListening();
        } else {
            resetTranscript();
            startListening();
        }
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

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
                navigate('/dashboard');
            }
        } catch (error) {
            // console.error(error); // removed to avoid linter warning if unused
            toast.error(error.response?.data?.message || 'Failed to request help');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-red-600 p-6 text-white text-center relative">
                    <h1 className="text-3xl font-bold">Request Emergency Help</h1>
                    <p className="opacity-90 mt-2">Nearby volunteers will be notified immediately</p>

                    {/* Voice Activation Button - Floating or prominent in header */}
                    <button
                        onClick={toggleVoice}
                        className={`absolute top-6 right-6 p-3 rounded-full shadow-lg transition-all duration-300 ${isListening ? 'bg-white text-red-600 animate-pulse ring-4 ring-red-300' : 'bg-red-800 text-white hover:bg-red-900'}`}
                        title={isListening ? "Stop listening" : "Tap to speak"}
                    >
                        {isListening ? <FaMicrophone className="text-xl" /> : <FaMicrophoneSlash className="text-xl" />}
                    </button>
                    {isListening && <div className="absolute -bottom-10 left-0 right-0 text-center"><span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold shadow-sm">Listening...</span></div>}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 mt-4">
                    {/* Voice Transcript Feedback */}
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emergency Type {isListening && <span className="text-xs text-green-600 animate-pulse ml-2">(Voice Active: "Medical", "Accident"...)</span>}
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white font-medium"
                        >
                            <option value="Medical">Medical Emergency</option>
                            <option value="Accident">Road Accident</option>
                            <option value="Blood">Blood Needed</option>
                            <option value="Disaster">Natural Disaster</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description / Voice Note</label>
                        <div className={`relative rounded-lg transition-all duration-300 ${isListening ? 'ring-2 ring-red-500' : ''}`}>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]"
                                placeholder={isListening ? "Listening... Speak now..." : "Briefly describe the situation or tap microphone to speak..."}
                                rows="3"
                            />
                            {isListening && (
                                <div className="absolute right-3 bottom-3 text-red-500 animate-pulse">
                                    <FaMicrophone />
                                </div>
                            )}
                        </div>
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

                    <p className="text-center text-sm text-gray-500 italic">
                        Tip: You can say "Send Help" to submit automatically if location is selected.
                    </p>

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
