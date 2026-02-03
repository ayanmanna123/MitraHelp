import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaUser, FaIdCard, FaCamera, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';

const VolunteerSignup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Personal Info, 2: Document Upload, 3: Review
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        governmentId: null,
        selfie: null
    });
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
            // Update profile with name and email
            if (formData.name || formData.email) {
                await api.put('/auth/profile', {
                    name: formData.name,
                    email: formData.email
                });
            }

            // Upload documents
            const uploadPromises = [];
            
            if (formData.governmentId) {
                const govFormData = new FormData();
                govFormData.append('governmentId', formData.governmentId);
                uploadPromises.push(
                    api.post('/volunteer/register', govFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    })
                );
            }
            
            if (formData.selfie) {
                const selfieFormData = new FormData();
                selfieFormData.append('selfie', formData.selfie);
                uploadPromises.push(
                    api.post('/volunteer/register', selfieFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    })
                );
            }

            if (uploadPromises.length > 0) {
                await Promise.all(uploadPromises);
            }

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Signup error:', error);
            alert('Error completing signup. Please try again.');
        }
    };

    const isStep1Valid = formData.name && formData.email;
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
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    step >= num ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
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
                            
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="flex items-start">
                                    <FaUser className="text-blue-500 text-xl mt-0.5 mr-3" />
                                    <div>
                                        <h3 className="font-medium text-blue-800">Why we need this info</h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                            This information helps us verify your identity and contact you about volunteer opportunities.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleNext}
                                disabled={!isStep1Valid}
                                className={`px-6 py-3 rounded-lg font-medium ${
                                    isStep1Valid 
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
                                className={`px-6 py-3 rounded-lg font-medium ${
                                    isStep2Valid 
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{formData.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{formData.email}</p>
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
        </div>
    );
};

export default VolunteerSignup;
