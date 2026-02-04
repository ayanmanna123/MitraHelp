#!/usr/bin/env python3
"""
Face Verification Script using TensorFlow/Keras
This script compares faces in two images to verify if they are the same person.
Usage: python face_verification.py <government_id_image_path> <selfie_image_path>
"""

import os
import sys
import cv2
import numpy as np
import json
from tensorflow.keras.applications import InceptionResNetV2
from tensorflow.keras.applications.inception_resnet_v2 import preprocess_input
from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import Model
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense
from scipy.spatial.distance import cosine
import base64
import io

class FaceVerificationSystem:
    def __init__(self):
        """Initialize the face verification system with a pre-trained model."""
        # Create face detection model using InceptionResNetV2 (pre-trained on ImageNet)
        # This is simpler and more stable than training custom models
        base_model = InceptionResNetV2(weights='imagenet', include_top=False, input_shape=(299, 299, 3))
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(128, activation='relu')(x)  # Embedding layer
        self.model = Model(inputs=base_model.input, outputs=x)
        
        # Model loaded successfully
    
    def load_and_preprocess_image(self, img_path_or_bytes, target_size=(299, 299)):
        """Load and preprocess image for model input."""
        try:
            # Handle base64 string input
            if isinstance(img_path_or_bytes, str) and img_path_or_bytes.startswith('data:image'):
                # Decode base64
                header, encoded = img_path_or_bytes.split(',', 1)
                data = base64.b64decode(encoded)
                nparr = np.frombuffer(data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    raise ValueError("Failed to decode image data")
                # Convert BGR to RGB
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Handle file path input
            elif isinstance(img_path_or_bytes, str):
                img = cv2.imread(img_path_or_bytes)
                if img is None:
                    raise ValueError(f"Could not read image file: {img_path_or_bytes}")
                # Convert BGR to RGB
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Handle bytes input
            elif isinstance(img_path_or_bytes, bytes):
                nparr = np.frombuffer(img_path_or_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    raise ValueError("Failed to decode image bytes")
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            else:
                raise ValueError("Unsupported image input type")
            
            # Resize image
            img = cv2.resize(img, target_size)
            
            # Convert to array and preprocess
            img_array = image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = preprocess_input(img_array)
            
            return img_array
            
        except Exception as e:
            raise ValueError(f"Error processing image: {str(e)}")
    
    def extract_face_embedding(self, img_array):
        """Extract face embedding using the pre-trained model."""
        try:
            embedding = self.model.predict(img_array, verbose=0)
            return embedding.flatten()
        except Exception as e:
            raise ValueError(f"Error extracting face embedding: {str(e)}")
    
    def calculate_similarity(self, embedding1, embedding2):
        """Calculate cosine similarity between two embeddings."""
        try:
            # Calculate cosine distance (0 = identical, 1 = completely different)
            distance = cosine(embedding1, embedding2)
            # Convert to similarity score (1 = identical, 0 = completely different)
            similarity = 1 - distance
            return max(0, min(1, similarity))  # Clamp between 0 and 1
        except Exception as e:
            raise ValueError(f"Error calculating similarity: {str(e)}")
    
    def verify_faces(self, img1_path, img2_path):
        """Main function to verify if two images contain the same face."""
        try:
            # Load and preprocess images
            # Loading and preprocessing images
            img1_array = self.load_and_preprocess_image(img1_path)
            img2_array = self.load_and_preprocess_image(img2_path)
            
            # Extract embeddings
            # Extracting face embeddings
            embedding1 = self.extract_face_embedding(img1_array)
            embedding2 = self.extract_face_embedding(img2_array)
            
            # Calculate similarity
            # Calculating similarity
            similarity_score = self.calculate_similarity(embedding1, embedding2)
            
            # Determine verification result
            threshold = 0.7  # Adjust this threshold as needed
            is_verified = similarity_score >= threshold
            
            result = {
                "success": True,
                "match_score": float(similarity_score),
                "is_verified": bool(is_verified),
                "threshold": threshold,
                "message": "Face verification completed successfully"
            }
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "match_score": 0.0,
                "is_verified": False,
                "message": f"Face verification failed: {str(e)}"
            }

def main():
    """Main function to run face verification from command line."""
    if len(sys.argv) != 3:
        print("Usage: python face_verification.py <government_id_image_path> <selfie_image_path>")
        print("Or pipe JSON input: {\"gov_id\": \"path_or_base64\", \"selfie\": \"path_or_base64\"}")
        sys.exit(1)
    
    # Check if input is JSON (from Node.js)
    if sys.argv[1].startswith('{') and sys.argv[1].endswith('}'):
        try:
            input_data = json.loads(sys.argv[1])
            gov_id_path = input_data.get('gov_id')
            selfie_path = input_data.get('selfie')
        except json.JSONDecodeError:
            print(json.dumps({"success": False, "error": "Invalid JSON input"}))
            sys.exit(1)
    else:
        # Command line arguments
        gov_id_path = sys.argv[1]
        selfie_path = sys.argv[2]
    
    if not gov_id_path or not selfie_path:
        print(json.dumps({"success": False, "error": "Both image paths are required"}))
        sys.exit(1)
    
    # Initialize verification system
    verifier = FaceVerificationSystem()
    
    # Perform verification
    result = verifier.verify_faces(gov_id_path, selfie_path)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
