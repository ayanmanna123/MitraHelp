#!/usr/bin/env python3
"""
Test Python face verification with real uploaded images
"""

import os
import sys
import json
from face_verification import FaceVerificationSystem

def test_real_images():
    """Test face verification with real user uploaded images"""
    
    # Base directory for uploads
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'face-verification')
    
    if not os.path.exists(uploads_dir):
        print("❌ Uploads directory not found")
        return
    
    # Get all user directories
    user_dirs = [d for d in os.listdir(uploads_dir) 
                 if os.path.isdir(os.path.join(uploads_dir, d))]
    
    print(f"🔍 Found {len(user_dirs)} user directories with test images\n")
    
    # Initialize verification system
    print("🔄 Initializing face verification system...")
    verifier = FaceVerificationSystem()
    print("✅ System initialized\n")
    
    # Test each user's images
    for i, user_dir in enumerate(user_dirs, 1):
        user_path = os.path.join(uploads_dir, user_dir)
        images = os.listdir(user_path)
        
        # Find government ID and selfie images
        gov_id_path = None
        selfie_path = None
        
        for img in images:
            if 'gov-id' in img and img.endswith('.jpg'):
                gov_id_path = os.path.join(user_path, img)
            elif 'selfie' in img and img.endswith('.jpg'):
                selfie_path = os.path.join(user_path, img)
        
        if gov_id_path and selfie_path:
            print(f"--- Test {i}: User {user_dir} ---")
            print(f"Government ID: {os.path.basename(gov_id_path)}")
            print(f"Selfie: {os.path.basename(selfie_path)}")
            
            try:
                # Perform verification
                result = verifier.verify_faces(gov_id_path, selfie_path)
                
                if result["success"]:
                    match_score = result["match_score"]
                    is_verified = result["is_verified"]
                    threshold = result["threshold"]
                    
                    print(f"📊 Match Score: {match_score * 100:.2f}%")
                    print(f"✅ Verified: {'YES' if is_verified else 'NO'}")
                    print(f"🎯 Threshold: {threshold * 100:.0f}%")
                    
                    if is_verified:
                        print("🎉 Faces match! Same person detected.")
                    else:
                        print("⚠️  Faces don't match or similarity below threshold.")
                else:
                    print(f"❌ Verification failed: {result['error']}")
                    
            except Exception as e:
                print(f"❌ Error processing images: {str(e)}")
            
            print("-" * 50)
        else:
            print(f"⚠️  Incomplete data for user {user_dir}")

if __name__ == "__main__":
    test_real_images()
