/**
 * Utility functions for face verification using face-api.js
 */

export const performFaceComparison = async (idImage, selfieImage) => {
  try {
    // Load face-api.js dynamically
    const faceapi = await import('face-api.js');
    
    // Create image elements from blob URLs
    const idImageUrl = URL.createObjectURL(idImage);
    const selfieImageUrl = URL.createObjectURL(selfieImage);
    
    // Create image elements
    const idImg = new Image();
    idImg.src = idImageUrl;
    
    const selfieImg = new Image();
    selfieImg.src = selfieImageUrl;
    
    // Wait for images to load
    await new Promise((resolve) => {
      idImg.onload = resolve;
    });
    
    await new Promise((resolve) => {
      selfieImg.onload = resolve;
    });
    
    // Load face-api models from CDN first, then fallback to local
    try {
      // Try loading from CDN
      await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    } catch (cdnLoadError) {
      console.warn('Could not load face-api models from CDN, trying local models:', cdnLoadError);
      try {
        // Try loading from local public directory
        await faceapi.nets.tinyFaceDetector.load('/models');
        await faceapi.nets.faceLandmark68Net.load('/models');
        await faceapi.nets.faceRecognitionNet.load('/models');
      } catch (localLoadError) {
        console.warn('Could not load local face-api models, throwing error:', localLoadError);
        // Revoke object URLs before throwing
        URL.revokeObjectURL(idImageUrl);
        URL.revokeObjectURL(selfieImageUrl);
        throw new Error('Failed to load face recognition models');
      }
    }
    
    // Detect faces in both images
    const idDetections = await faceapi.detectAllFaces(idImg, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    const selfieDetections = await faceapi.detectAllFaces(selfieImg, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    // Revoke object URLs after processing
    URL.revokeObjectURL(idImageUrl);
    URL.revokeObjectURL(selfieImageUrl);
    
    if (idDetections.length === 0) {
      throw new Error('No face detected in government ID image');
    }
    
    if (selfieDetections.length === 0) {
      throw new Error('No face detected in selfie image');
    }
    
    if (idDetections.length > 1) {
      throw new Error('Multiple faces detected in government ID image. Please upload an image with only your face.');
    }
    
    if (selfieDetections.length > 1) {
      throw new Error('Multiple faces detected in selfie image. Please upload a selfie with only your face.');
    }
    
    // Calculate distance between face descriptors
    const idDescriptor = idDetections[0].descriptor;
    const selfieDescriptor = selfieDetections[0].descriptor;
    
    // Calculate Euclidean distance (lower distance = more similar)
    const distance = faceapi.euclideanDistance(idDescriptor, selfieDescriptor);
    
    // Convert distance to similarity score (0 to 1, where 1 is identical)
    // Typical distance threshold for same person is around 0.4-0.6
    const maxDistance = 0.6;
    const matchScore = Math.max(0, Math.min(1, (maxDistance - distance) / maxDistance));
    const isVerified = matchScore > 0.7; // Threshold for verification
    
    return { matchScore, isVerified };
  } catch (error) {
    console.error('Face comparison error:', error);
    
    // Revoke any remaining object URLs in case of error
    try {
      URL.revokeObjectURL(URL.createObjectURL(idImage));
      URL.revokeObjectURL(URL.createObjectURL(selfieImage));
    } catch(e) {
      // Ignore errors when revoking URLs in error case
    }
    
    throw error;
  }
};

export const simulateFaceComparison = async () => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Simulate a match score (between 0 and 1)
  const matchScore = Math.random() * 0.5 + 0.5; // Random score between 0.5 and 1.0
  const isVerified = matchScore > 0.7; // Threshold for verification
  
  return { matchScore, isVerified };
};