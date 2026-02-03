import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [role, setRole] = useState('user'); // user or volunteer
    const [step, setStep] = useState('phone'); // phone or otp or role
    const { sendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        const success = await sendOtp(phone);
        if (success) setStep('otp');
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const success = await verifyOtp(phone, otp, role);
        if (success) {
            // If user selected volunteer role, redirect to volunteer signup
            if (role === 'volunteer') {
                navigate('/volunteer-signup');
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    {step === 'phone' ? 'Login / Register' : step === 'otp' ? 'Enter OTP' : 'Select Role'}
                </h2>

                {step === 'phone' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="+91 9876543210"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition">
                            Send OTP
                        </button>
                    </form>
                ) : step === 'otp' ? (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="123456"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition">
                            Verify & Continue
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-gray-600 mb-6">Welcome! Please select how you'd like to use MitraHelp:</p>
                        </div>
                        
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                className={`w-full p-4 border-2 rounded-lg text-left transition $ {
                                    role === 'user' 
                                        ? 'border-red-500 bg-red-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center $ {
                                        role === 'user' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                                    }`}>
                                        {role === 'user' && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Regular User</h3>
                                        <p className="text-sm text-gray-600">Request help during emergencies and connect with volunteers</p>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setRole('volunteer')}
                                className={`w-full p-4 border-2 rounded-lg text-left transition $ {
                                    role === 'volunteer' 
                                        ? 'border-red-500 bg-red-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center $ {
                                        role === 'volunteer' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                                    }`}>
                                        {role === 'volunteer' && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Volunteer</h3>
                                        <p className="text-sm text-gray-600">Help others by responding to emergency requests in your area</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => {
                                // Set role and proceed to dashboard
                                if (role === 'volunteer') {
                                    navigate('/volunteer-signup');
                                } else {
                                    navigate('/dashboard');
                                }
                            }}
                            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
                        >
                            Continue as {role === 'volunteer' ? 'Volunteer' : 'User'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
