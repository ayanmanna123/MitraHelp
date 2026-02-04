# Face Verification User Guide

## Overview

The face verification system uses Python with TensorFlow to verify user identity by comparing government ID photos with selfies. This ensures that only legitimate users can access the platform.

## How It Works

1. **User uploads** a government-issued ID (passport, driver's license, etc.) and a selfie
2. **Images are processed** by a Python backend using TensorFlow's InceptionResNetV2 model
3. **Face embeddings** are extracted and compared using cosine similarity
4. **Verification result** is returned with a match score (0-100%)

## Accessing Face Verification

### For Users:
1. Log in to your account
2. Click on **"Verify Identity"** in the navigation menu
3. Or navigate to `/face-verification` directly

### For Admins:
1. Go to **Admin Panel**
2. Navigate to **Face Verification Management**
3. Review and approve/reject pending verifications

## Step-by-Step Process

### 1. Upload Government ID
- Click "Click to upload" in the Government ID section
- Select a clear photo of your government-issued ID
- Supported formats: JPG, PNG
- Maximum size: 5MB

### 2. Upload Selfie
- Click "Upload selfie" or use the camera option
- Take a clear photo showing your face
- Ensure good lighting and remove any obstructions (hats, sunglasses)

### 3. Submit for Verification
- Click the "Submit for Verification" button
- Wait for processing (10-20 seconds)
- View results with match score

## Verification Results

### Success (Match Score ≥ 70%)
- ✅ Identity verified
- Access to full platform features
- Match score displayed

### Pending (Manual Review)
- ⏳ Awaiting admin review
- Check back later for status update

### Rejected (Match Score < 70%)
- ❌ Verification failed
- Try again with better quality images
- Common issues:
  - Poor lighting
  - Blurry images
  - Different facial expressions
  - Age differences between ID and current photo

## Tips for Better Results

1. **Lighting**: Ensure good, even lighting on your face
2. **Image Quality**: Use high-resolution images (minimum 640x480)
3. **Face Visibility**: Make sure your entire face is visible
4. **Expression**: Maintain a neutral expression
5. **ID Clarity**: Ensure ID text and photo are readable
6. **No Obstructions**: Remove hats, sunglasses, or face coverings

## Technical Details

- **Model**: InceptionResNetV2 (pre-trained on ImageNet)
- **Input Size**: 299×299 RGB images
- **Embedding**: 128-dimensional face vectors
- **Similarity**: Cosine distance
- **Threshold**: 70% for automatic verification

## Troubleshooting

### Common Issues:

**"Please upload both images"**
- Make sure both Government ID and Selfie are selected

**"Camera access denied"**
- Allow camera permissions in your browser
- Try using file upload instead

**"Verification failed"**
- Try again with clearer images
- Ensure consistent lighting
- Use a recent selfie (similar to your current appearance)

**"Processing takes too long"**
- This is normal for the first verification (model loading)
- Subsequent verifications are faster
- Check your internet connection

## Admin Features

Admins can:
- View all pending verification requests
- Approve or reject verifications manually
- Add notes for rejected cases
- Filter by verification status
- Search by user information

## Security Notes

- All images are processed securely on the server
- No facial data is stored permanently
- Images are deleted after processing
- Only match scores and verification status are saved
- End-to-end encryption for data transmission

## Support

If you're having issues with face verification:
1. Check the troubleshooting section above
2. Try multiple attempts with different images
3. Contact support with your user ID and issue details
4. Admins can manually verify your identity if needed
