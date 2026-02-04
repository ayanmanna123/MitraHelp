# Python-Based Face Verification System

This system uses TensorFlow and OpenCV to perform face verification by comparing faces in government ID images and selfies.

## Setup Instructions

### 1. Install Python Dependencies

Run the installation script:
```bash
# On Windows
install_python_deps.bat

# On Linux/Mac
pip install -r requirements.txt
```

Required packages:
- `tensorflow==2.15.0`
- `opencv-python==4.9.0.80`
- `numpy==1.24.3`
- `scipy==1.11.4`

### 2. How It Works

1. **Image Upload**: User uploads government ID and selfie images
2. **Backend Processing**: Images are sent to Python script for face verification
3. **Face Embedding**: Uses InceptionResNetV2 (pre-trained on ImageNet) to extract face features
4. **Similarity Calculation**: Compares face embeddings using cosine similarity
5. **Verification Result**: Returns match score and verification status

### 3. API Endpoints

#### POST `/api/face-verification/upload`
Upload government ID and selfie images
- **Body**: `multipart/form-data` with `governmentId` and `selfie` files
- **Response**: Verification ID and image paths

#### POST `/api/face-verification/process`
Process face verification using Python backend
- **Body**: `{ "verificationId": "user_id" }`
- **Response**: Match score and verification status

#### GET `/api/face-verification/status`
Get current verification status
- **Response**: Current status and match details

### 4. How Face Matching Works

The system uses:
- **Model**: InceptionResNetV2 (pre-trained on ImageNet)
- **Input Size**: 299x299 RGB images
- **Embedding Size**: 128-dimensional vector
- **Similarity Metric**: Cosine similarity
- **Verification Threshold**: 0.7 (70%)

### 5. Fallback Mechanism

If Python verification fails:
- System falls back to simulated verification
- Returns random match score for testing purposes

### 6. Testing the System

You can test the Python script directly:
```bash
# Test with image files
python face_verification.py path/to/gov_id.jpg path/to/selfie.jpg

# Test with JSON input (base64 encoded)
python face_verification.py "{\"gov_id\": \"base64_data\", \"selfie\": \"base64_data\"}"
```

### 7. Troubleshooting

**Common Issues:**
- **Python not found**: Install Python 3.8+ and add to PATH
- **TensorFlow installation fails**: Try `pip install --upgrade pip` first
- **OpenCV import error**: Reinstall with `pip install opencv-python --force-reinstall`
- **Memory issues**: TensorFlow may require significant RAM (4GB+ recommended)

**Check Installation:**
```python
# Test Python packages
python -c "import tensorflow as tf; import cv2; import numpy as np; print('All packages installed successfully')"
```

### 8. Security Notes

- Images are stored temporarily during processing
- Files are cleaned up after verification
- Base64 encoding supported for direct data transfer
- No image data is stored permanently in the verification process
