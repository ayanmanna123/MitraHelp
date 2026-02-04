#!/usr/bin/env python3
"""
Face Verification Script with consistent results
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

# Global model instance for consistent results
MODEL = None

def get_model():
    """Get or create the model instance (singleton pattern)"""
    global MODEL
    if MODEL is None:
        # Loading model for the first time
        base_model = InceptionResNetV2(
            weights='imagenet', 
            include_top=False, 
            input_shape=(299, 299, 3)
        )
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(128, activation='relu')(x)
        MODEL = Model(inputs=base_model.input, outputs=x)
        # Model loaded successfully
    return MODEL

class FaceVerificationSystem:
    def __init__(self):
        """Initialize the face verification system"""
        self.model = get_model()
    
    def load_and_preprocess_image(self, img_path, target_size=(299, 299)):
        """Load and preprocess image"""
        try:
            img = cv2.imread(img_path)
            if img is None:
                raise ValueError(f"Could not read image file: {img_path}")
            
            # Convert BGR to RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
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
        """Extract face embedding using the pre-trained model"""
        try:
            # Warm up model on first call
            embedding = self.model.predict(img_array, verbose=0)
            return embedding.flatten()
        except Exception as e:
            raise ValueError(f"Error extracting face embedding: {str(e)}")
    
    def calculate_similarity(self, embedding1, embedding2):
        """Calculate cosine similarity between two embeddings with NaN handling"""
        try:
            # Check for NaN values
            if np.any(np.isnan(embedding1)) or np.any(np.isnan(embedding2)):
                print("Warning: NaN values detected in embeddings", file=sys.stderr)
                return 0.0
            
            # Check for zero vectors
            if np.all(embedding1 == 0) or np.all(embedding2 == 0):
                print("Warning: Zero vectors detected", file=sys.stderr)
                return 0.0
            
            # Calculate cosine distance with proper error handling
            try:
                distance = cosine(embedding1, embedding2)
                # Check if distance calculation produced NaN
                if np.isnan(distance):
                    print("Warning: Cosine distance resulted in NaN", file=sys.stderr)
                    # Fall back to manual cosine calculation
                    norm1 = np.linalg.norm(embedding1)
                    norm2 = np.linalg.norm(embedding2)
                    if norm1 == 0 or norm2 == 0:
                        return 0.0
                    dot_product = np.dot(embedding1, embedding2)
                    cosine_sim = dot_product / (norm1 * norm2)
                    # Clamp to valid range
                    cosine_sim = np.clip(cosine_sim, -1.0, 1.0)
                    return float(cosine_sim)
                else:
                    similarity = 1 - distance
                    return float(np.clip(similarity, 0.0, 1.0))
            except Exception as distance_error:
                print(f"Warning: Cosine distance failed: {distance_error}", file=sys.stderr)
                # Fall back to manual calculation
                norm1 = np.linalg.norm(embedding1)
                norm2 = np.linalg.norm(embedding2)
                if norm1 == 0 or norm2 == 0:
                    return 0.0
                dot_product = np.dot(embedding1, embedding2)
                cosine_sim = dot_product / (norm1 * norm2)
                cosine_sim = np.clip(cosine_sim, -1.0, 1.0)
                return float(cosine_sim)
                
        except Exception as e:
            print(f"Error in similarity calculation: {str(e)}", file=sys.stderr)
            return 0.0
    
    def verify_faces(self, img1_path, img2_path):
        """Main function to verify if two images contain the same face"""
        try:
            # Load and preprocess images
            img1_array = self.load_and_preprocess_image(img1_path)
            img2_array = self.load_and_preprocess_image(img2_path)
            
            # Extract embeddings
            embedding1 = self.extract_face_embedding(img1_array)
            embedding2 = self.extract_face_embedding(img2_array)
            
            # Calculate similarity
            similarity_score = self.calculate_similarity(embedding1, embedding2)
            
            # Determine verification result
            threshold = 0.7
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
    """Main function"""
    if len(sys.argv) != 3:
        print("Usage: python face_verification_consistent.py <government_id_image_path> <selfie_image_path>")
        sys.exit(1)
    
    gov_id_path = sys.argv[1]
    selfie_path = sys.argv[2]
    
    if not os.path.exists(gov_id_path) or not os.path.exists(selfie_path):
        print(json.dumps({"success": False, "error": "Image files not found"}))
        sys.exit(1)
    
    # Initialize verification system
    verifier = FaceVerificationSystem()
    
    # Perform verification
    result = verifier.verify_faces(gov_id_path, selfie_path)
    
    # Output result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main()
