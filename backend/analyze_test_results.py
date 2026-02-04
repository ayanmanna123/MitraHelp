#!/usr/bin/env python3
"""
Analyze face verification results in detail
"""

import os
import cv2
import numpy as np
from face_verification import FaceVerificationSystem

def analyze_images(gov_id_path, selfie_path):
    """Analyze image properties and quality"""
    print(f"Government ID: {os.path.basename(gov_id_path)}")
    print(f"Selfie: {os.path.basename(selfie_path)}")
    
    # Load images
    gov_img = cv2.imread(gov_id_path)
    selfie_img = cv2.imread(selfie_path)
    
    if gov_img is None or selfie_img is None:
        print("❌ Could not load images")
        return
    
    # Image properties
    print(f"Government ID size: {gov_img.shape[1]}x{gov_img.shape[0]} pixels")
    print(f"Selfie size: {selfie_img.shape[1]}x{selfie_img.shape[0]} pixels")
    
    # Check if images are color
    print(f"Government ID channels: {gov_img.shape[2] if len(gov_img.shape) > 2 else 1}")
    print(f"Selfie channels: {selfie_img.shape[2] if len(selfie_img.shape) > 2 else 1}")
    
    # Brightness analysis
    gov_gray = cv2.cvtColor(gov_img, cv2.COLOR_BGR2GRAY)
    selfie_gray = cv2.cvtColor(selfie_img, cv2.COLOR_BGR2GRAY)
    
    gov_brightness = np.mean(gov_gray)
    selfie_brightness = np.mean(selfie_gray)
    
    print(f"Government ID brightness: {gov_brightness:.2f}")
    print(f"Selfie brightness: {selfie_brightness:.2f}")
    print(f"Brightness difference: {abs(gov_brightness - selfie_brightness):.2f}")
    
    # Face detection attempt
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    gov_faces = face_cascade.detectMultiScale(gov_gray, 1.1, 4)
    selfie_faces = face_cascade.detectMultiScale(selfie_gray, 1.1, 4)
    
    print(f"Faces detected in Government ID: {len(gov_faces)}")
    print(f"Faces detected in Selfie: {len(selfie_faces)}")
    
    if len(gov_faces) > 0:
        print(f"Government ID face size: {gov_faces[0][2]}x{gov_faces[0][3]}")
    if len(selfie_faces) > 0:
        print(f"Selfie face size: {selfie_faces[0][2]}x{selfie_faces[0][3]}")

def detailed_test():
    """Run detailed analysis on all test images"""
    
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'face-verification')
    
    if not os.path.exists(uploads_dir):
        print("❌ Uploads directory not found")
        return
    
    user_dirs = [d for d in os.listdir(uploads_dir) 
                 if os.path.isdir(os.path.join(uploads_dir, d))]
    
    print(f"🔍 Analyzing {len(user_dirs)} user datasets\n")
    
    verifier = FaceVerificationSystem()
    
    for i, user_dir in enumerate(user_dirs, 1):
        print("=" * 60)
        print(f"ANALYSIS {i}: User {user_dir}")
        print("=" * 60)
        
        user_path = os.path.join(uploads_dir, user_dir)
        images = os.listdir(user_path)
        
        gov_id_path = None
        selfie_path = None
        
        for img in images:
            if 'gov-id' in img and img.endswith('.jpg'):
                gov_id_path = os.path.join(user_path, img)
            elif 'selfie' in img and img.endswith('.jpg'):
                selfie_path = os.path.join(user_path, img)
        
        if gov_id_path and selfie_path:
            # Analyze image properties
            analyze_images(gov_id_path, selfie_path)
            print()
            
            # Run verification
            result = verifier.verify_faces(gov_id_path, selfie_path)
            
            if result["success"]:
                match_score = result["match_score"]
                is_verified = result["is_verified"]
                
                print(f"📊 MATCH SCORE: {match_score * 100:.2f}%")
                print(f"✅ VERIFIED: {'YES' if is_verified else 'NO'}")
                print(f"🎯 THRESHOLD: {result['threshold'] * 100:.0f}%")
                
                # Additional analysis
                if match_score < 0.5:
                    print("🔍 NOTE: Very low similarity - likely different people")
                elif match_score < 0.7:
                    print("🔍 NOTE: Moderate similarity - might be same person with variations")
                else:
                    print("🔍 NOTE: High similarity - likely same person")
            else:
                print(f"❌ Verification failed: {result['error']}")
        else:
            print("⚠️  Incomplete data")
        
        print("\n")

if __name__ == "__main__":
    detailed_test()
