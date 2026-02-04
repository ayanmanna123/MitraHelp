import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import api from '../services/api';
// import { performFaceComparison, simulateFaceComparison } from '../utils/faceVerification';

const FaceVerification = () => {
  const [governmentIdImage, setGovernmentIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [governmentIdPreview, setGovernmentIdPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0); // For upload progress
  const [isCameraActive, setIsCameraActive] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Get verification status on component mount
  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await api.get('/face-verification/status');
      setVerificationStatus(response.data.data);
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  const handleGovernmentIdChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGovernmentIdImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGovernmentIdPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelfieImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Capture selfie from camera
  const captureSelfie = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (err) {
      setError('Camera access denied. Please allow camera access to take a selfie.');
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelfieImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Stop camera
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
      setIsCameraActive(false);
    }, 'image/jpeg', 0.8);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!governmentIdImage || !selfieImage) {
      setError('Please upload both government ID and selfie images');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('governmentId', governmentIdImage);
      formData.append('selfie', selfieImage);

      // Upload images first with progress tracking
      const uploadResponse = await api.post('/face-verification/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      // Reset progress and show processing
      setProgress(0);
      setIsProcessing(true);
      
      // Process face verification using Python backend
      const processResponse = await api.post('/face-verification/process', {
        verificationId: uploadResponse.data.data.verificationId
      });

      const { matchScore, isVerified } = processResponse.data.data;

      setMessage(isVerified
        ? `Face verification successful! Your identity has been verified. Match score: ${(matchScore * 100).toFixed(2)}%`
        : `Face verification failed. Please try again with clearer images. Match score: ${(matchScore * 100).toFixed(2)}%`);

      // Refresh status
      fetchVerificationStatus();

      // Reset form
      setGovernmentIdImage(null);
      setSelfieImage(null);
      setGovernmentIdPreview(null);
      setSelfiePreview(null);
    } catch (err) {
      console.error('Error during face verification:', err);
      setError(err.response?.data?.message || 'An error occurred during face verification. Please try again.');
    } finally {
      setLoading(false);
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // If user is already verified, show different content
  if (verificationStatus?.status === 'verified') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Identity Verification</h2>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>Your identity has been verified!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {verificationStatus.governmentIdImage && (
            <div>
              <h3 className="font-semibold mb-2">Government ID:</h3>
              <img
                src={verificationStatus.governmentIdImage}
                alt="Government ID"
                className="w-full h-auto rounded border"
              />
            </div>
          )}
          {verificationStatus.selfieImage && (
            <div>
              <h3 className="font-semibold mb-2">Selfie:</h3>
              <img
                src={verificationStatus.selfieImage}
                alt="Selfie"
                className="w-full h-auto rounded border"
              />
            </div>
          )}
        </div>
        <p className="mb-4">Match Score: {(verificationStatus.matchScore * 100).toFixed(2)}%</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Identity Verification</h2>

      {verificationStatus?.status === 'pending' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Your verification is pending review. Please check back later.</p>
        </div>
      )}

      {verificationStatus?.status === 'rejected' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Your verification was rejected. Please try again with better quality images.</p>
        </div>
      )}

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isProcessing && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="mr-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
            </div>
            <span>Processing your images with Python AI... This may take 10-20 seconds.</span>
          </div>
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-blue-700">Uploading images...</span>
            <span className="text-sm font-medium text-blue-700">{progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Government ID Upload */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Government ID</h3>
            <p className="text-sm text-gray-600 mb-3">Upload a clear photo of your government-issued ID (passport, driver's license, etc.)</p>

            {!governmentIdPreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGovernmentIdChange}
                  className="hidden"
                  id="government-id-upload"
                />
                <label htmlFor="government-id-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="mt-2 text-sm font-medium text-gray-600">Click to upload</span>
                    <span className="text-xs text-gray-500">JPG, PNG (Max 5MB)</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={governmentIdPreview}
                  alt="Government ID Preview"
                  className="w-full h-48 object-contain rounded border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setGovernmentIdImage(null);
                    setGovernmentIdPreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Selfie Upload */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Selfie Photo</h3>
            <p className="text-sm text-gray-600 mb-3">Take a clear selfie photo showing your face</p>

            {!selfiePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieChange}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="mt-2 text-sm font-medium text-gray-600">Upload selfie</span>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={captureSelfie}
                  className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Take Selfie with Camera
                </button>

                {/* Hidden video and canvas for camera capture */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', maxHeight: '200px', display: isCameraActive ? 'block' : 'none' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {isCameraActive && (
                  <button
                    id="capture-btn"
                    type="button"
                    onClick={captureFromCamera}
                    className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
                  >
                    Capture
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <img
                  src={selfiePreview}
                  alt="Selfie Preview"
                  className="w-full h-48 object-contain rounded border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelfieImage(null);
                    setSelfiePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Verification Tips:</h4>
            <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
              <li>Ensure your face is clearly visible in the selfie</li>
              <li>Good lighting helps improve verification accuracy</li>
              <li>Make sure ID text is readable and not blurry</li>
              <li>Remove hats, sunglasses, or anything covering your face</li>
            </ul>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !governmentIdImage || !selfieImage}
          className="w-full py-3 text-lg"
        >
          {loading ? 'Verifying Identity...' : 'Submit for Verification'}
        </Button>
      </form>
    </div>
  );
};

export default FaceVerification;