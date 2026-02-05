import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { FaUser, FaCheckCircle, FaTimesCircle, FaClock, FaUpload, FaShieldAlt, FaAmbulance, FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const VolunteerProfile = () => {
    const { user } = useAuth();
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState({
        governmentId: null,
        selfie: null
    });
    const [uploadStatus, setUploadStatus] = useState({
        governmentId: false,
        selfie: false
    });
    const [recentEmergency, setRecentEmergency] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    // Function to render star ratings
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
        }
        
        if (hasHalfStar) {
            stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
        }
        
        const emptyStars = 5 - stars.length;
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
        }
        
        return stars;
    };

    const fetchReviews = async () => {
        try {
            setLoadingReviews(true);
            const response = await api.get(`/emergency/reviews/volunteer/${user._id}`);
            if (response.data.success) {
                setReviews(response.data.data.reviews);
                setAverageRating(response.data.data.averageRating);
                setTotalReviews(response.data.data.totalReviews);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    useEffect(() => {
        const fetchVolunteerProgress = async () => {
            try {
                const response = await api.get('/volunteer/progress');
                if (response.data.success) {
                    setProgressData(response.data.data);

                    // Update upload status based on document availability
                    setUploadStatus(prev => ({
                        ...prev,
                        governmentId: !!user?.governmentIdImage,
                        selfie: !!user?.selfieImage
                    }));
                }
            } catch (error) {
                console.error('Error fetching progress:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchRecentEmergency = async () => {
            if (user?.role === 'volunteer') { // Only fetch if volunteer
                try {
                    const response = await api.get('/emergency/assigned');
                    if (response.data.success && response.data.data) {
                        setRecentEmergency(response.data.data);
                    }
                } catch (error) {
                    console.error('Error fetching recent emergency:', error);
                }
            }
        };

        fetchVolunteerProgress();
        fetchRecentEmergency();
        fetchReviews();
    }, [user]);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setDocuments(prev => ({
                ...prev,
                [type]: file
            }));
        }
    };

    const handleUpload = async (type) => {
        if (!documents[type]) return;

        const formData = new FormData();
        formData.append(type, documents[type]);

        try {
            const response = await api.post('/volunteer/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setUploadStatus(prev => ({
                    ...prev,
                    [type]: true
                }));

                // Refresh progress data
                try {
                    const progressResponse = await api.get('/volunteer/progress');
                    if (progressResponse.data.success) {
                        setProgressData(progressResponse.data.data);

                        // Update upload status based on document availability
                        setUploadStatus(prev => ({
                            ...prev,
                            governmentId: !!user?.governmentIdImage,
                            selfie: !!user?.selfieImage
                        }));
                    }
                } catch (progressError) {
                    console.error('Error fetching updated progress:', progressError);
                }

                // If user status changed to approved, refresh user data
                if (response.data.data?.progress?.verificationPending &&
                    (user?.volunteerStatus === 'pending' || user?.volunteerStatus === 'not_applied')) {
                    // Refresh the user data in auth context to update role
                    setTimeout(() => {
                        window.location.reload(); // Simple way to refresh everything
                    }, 1000); // Wait a bit for server to process
                }

                alert(response.data.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading document');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-red-600">Volunteer Profile</h1>
                <Link to="/volunteer-dashboard" className="text-gray-600 hover:text-red-500 font-medium text-sm">
                    Back to Dashboard
                </Link>
            </nav>

            <main className="container mx-auto px-4 py-8">
                {/* Active/Recent Emergency Card */}
                {recentEmergency && (
                    <div className="bg-white rounded-xl shadow p-6 mb-8 border-l-4 border-red-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <FaAmbulance className="text-red-600" />
                                    {recentEmergency.status === 'Completed' ? 'Recent Emergency' : 'Active Emergency'}
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    <span className="font-semibold">{recentEmergency.type}</span> request from {recentEmergency.requester?.name || 'User'}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Status: <span className={`font-semibold ${recentEmergency.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                                        }`}>{recentEmergency.status}</span> • {new Date(recentEmergency.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Link
                                to={`/emergency/${recentEmergency._id}`}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                            >
                                View Details <FaExternalLinkAlt size={14} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Progress Overview */}
                <div className="bg-white rounded-xl shadow p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Registration Progress</h2>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            {progressData?.percentage}% Complete
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500 ease-in-out"
                                style={{ width: `${progressData?.percentage}%` }}
                            ></div>
                        </div>
                        <p className="text-right text-sm text-gray-600 mt-2">
                            {progressData?.completedSteps} of {progressData?.totalSteps} steps completed
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-4">
                        <div className={`flex items-center p-4 rounded-lg border ${progressData?.personalInfoComplete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${progressData?.personalInfoComplete ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                {progressData?.personalInfoComplete ? (
                                    <FaCheckCircle className="text-white" />
                                ) : (
                                    <FaUser className="text-gray-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">Personal Information</h3>
                                <p className="text-sm text-gray-600">Complete your profile with name, email, and phone</p>
                            </div>
                            <div>
                                {progressData?.personalInfoComplete ? (
                                    <span className="text-green-600 font-medium">Completed</span>
                                ) : (
                                    <span className="text-yellow-600 font-medium">Pending</span>
                                )}
                            </div>
                        </div>

                        <div className={`flex items-center p-4 rounded-lg border ${progressData?.documentsUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${progressData?.documentsUploaded ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                {progressData?.documentsUploaded ? (
                                    <FaCheckCircle className="text-white" />
                                ) : (
                                    <FaUpload className="text-gray-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">Document Upload</h3>
                                <p className="text-sm text-gray-600">Upload government ID and selfie for verification</p>
                            </div>
                            <div>
                                {progressData?.documentsUploaded ? (
                                    <span className="text-green-600 font-medium">Completed</span>
                                ) : (
                                    <span className="text-yellow-600 font-medium">Pending</span>
                                )}
                            </div>
                        </div>

                        <div className={`flex items-center p-4 rounded-lg border ${progressData?.verificationPending ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${progressData?.verificationPending ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                {progressData?.verificationPending ? (
                                    <FaCheckCircle className="text-white" />
                                ) : (
                                    <FaClock className="text-gray-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">Verification Process</h3>
                                <p className="text-sm text-gray-600">
                                    {user?.volunteerStatus === 'approved'
                                        ? 'Verification completed - You are authenticated!'
                                        : user?.volunteerStatus === 'pending'
                                            ? 'Under review by administrators'
                                            : 'Awaiting document submission'}
                                </p>
                            </div>
                            <div>
                                {user?.volunteerStatus === 'approved' ? (
                                    <span className="text-green-600 font-medium">Approved</span>
                                ) : user?.volunteerStatus === 'pending' ? (
                                    <span className="text-blue-600 font-medium">In Review</span>
                                ) : (
                                    <span className="text-yellow-600 font-medium">Pending</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document Upload Section */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Upload Documents</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Government ID Upload */}
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center ${uploadStatus.governmentId ? 'border-green-300 bg-green-50' : 'border-gray-300'
                            }`}>
                            <div className="flex flex-col items-center">
                                <FaShieldAlt className={`text-3xl mb-3 ${uploadStatus.governmentId ? 'text-green-500' : 'text-gray-400'
                                    }`} />
                                <h3 className="font-semibold mb-2">Government ID</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload a clear photo of your government-issued ID
                                </p>

                                {!uploadStatus.governmentId ? (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'governmentId')}
                                            className="mb-3"
                                        />
                                        <button
                                            onClick={() => handleUpload('governmentId')}
                                            disabled={!documents.governmentId}
                                            className={`px-4 py-2 rounded-lg font-medium ${documents.governmentId
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            Upload ID
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <FaCheckCircle className="text-green-500 text-2xl mb-2" />
                                        <p className="text-green-600 font-medium">Uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selfie Upload */}
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center ${uploadStatus.selfie ? 'border-green-300 bg-green-50' : 'border-gray-300'
                            }`}>
                            <div className="flex flex-col items-center">
                                <FaUser className={`text-3xl mb-3 ${uploadStatus.selfie ? 'text-green-500' : 'text-gray-400'
                                    }`} />
                                <h3 className="font-semibold mb-2">Selfie Verification</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload a clear selfie holding your ID
                                </p>

                                {!uploadStatus.selfie ? (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'selfie')}
                                            className="mb-3"
                                        />
                                        <button
                                            onClick={() => handleUpload('selfie')}
                                            disabled={!documents.selfie}
                                            className={`px-4 py-2 rounded-lg font-medium ${documents.selfie
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            Upload Selfie
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <FaCheckCircle className="text-green-500 text-2xl mb-2" />
                                        <p className="text-green-600 font-medium">Uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {user?.volunteerStatus === 'approved' && (
                        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
                            <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
                            <h3 className="text-lg font-semibold text-green-800">Authentication Complete!</h3>
                            <p className="text-green-700">You have been authenticated as a volunteer. You can now participate in emergency responses.</p>
                        </div>
                    )}

                    {user?.volunteerStatus === 'pending' && (
                        <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg text-center">
                            <FaClock className="text-blue-500 text-2xl mx-auto mb-2" />
                            <h3 className="text-lg font-semibold text-blue-800">Verification in Progress</h3>
                            <p className="text-blue-700">Your documents are being reviewed. You'll be notified once approved.</p>
                        </div>
                    )}

                    {user?.volunteerStatus === 'rejected' && (
                        <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-lg text-center">
                            <FaTimesCircle className="text-red-500 text-2xl mx-auto mb-2" />
                            <h3 className="text-lg font-semibold text-red-800">Verification Rejected</h3>
                            <p className="text-red-700">Your application was rejected. {user.rejectionReason && `Reason: ${user.rejectionReason}`}</p>
                        </div>
                    )}
                </div>

                {/* Reviews Section */}
                <div className="mt-8 bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FaStar className="text-yellow-400" />
                        Reviews & Ratings
                        {totalReviews > 0 && (
                            <span className="text-sm text-gray-500">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
                        )}
                    </h2>
                    
                    <div className="mb-6 flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-gray-800">{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</div>
                            <div className="flex justify-center gap-1 my-2">
                                {renderStars(averageRating)}
                            </div>
                            <div className="text-sm text-gray-600">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-16 text-sm text-gray-600">5 stars</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-yellow-400 h-2 rounded-full" 
                                        style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 5).length / reviews.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-xs text-gray-600">{reviews.length > 0 ? reviews.filter(r => r.rating === 5).length : 0}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-16 text-sm text-gray-600">4 stars</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-yellow-400 h-2 rounded-full" 
                                        style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 4).length / reviews.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-xs text-gray-600">{reviews.length > 0 ? reviews.filter(r => r.rating === 4).length : 0}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-16 text-sm text-gray-600">3 stars</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-yellow-400 h-2 rounded-full" 
                                        style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 3).length / reviews.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-xs text-gray-600">{reviews.length > 0 ? reviews.filter(r => r.rating === 3).length : 0}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-16 text-sm text-gray-600">2 stars</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-yellow-400 h-2 rounded-full" 
                                        style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 2).length / reviews.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-xs text-gray-600">{reviews.length > 0 ? reviews.filter(r => r.rating === 2).length : 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-16 text-sm text-gray-600">1 star</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-yellow-400 h-2 rounded-full" 
                                        style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 1).length / reviews.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-xs text-gray-600">{reviews.length > 0 ? reviews.filter(r => r.rating === 1).length : 0}</span>
                            </div>
                        </div>
                    </div>
                    
                    {loadingReviews ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        {renderStars(review.rating)}
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {review.anonymous ? 'Anonymous' : review.requester.name}
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="text-gray-700 pl-6">"{review.comment}"</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No reviews yet
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default VolunteerProfile;