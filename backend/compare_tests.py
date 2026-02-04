#!/usr/bin/env python3
"""
Compare results between different test runs
"""

import os
from face_verification import FaceVerificationSystem

def compare_results():
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'face-verification')
    user_dirs = [d for d in os.listdir(uploads_dir) 
                 if os.path.isdir(os.path.join(uploads_dir, d))]
    
    user_dir = user_dirs[0]  # Test with first user
    user_path = os.path.join(uploads_dir, user_dir)
    images = os.listdir(user_path)
    
    gov_id_path = None
    selfie_path = None
    
    for img in images:
        if 'gov-id' in img and img.endswith('.jpg'):
            gov_id_path = os.path.join(user_path, img)
        elif 'selfie' in img and img.endswith('.jpg'):
            selfie_path = os.path.join(user_path, img)
    
    if not (gov_id_path and selfie_path):
        print("❌ Could not find images")
        return
    
    print(f"Testing user: {user_dir}")
    print(f"Government ID: {os.path.basename(gov_id_path)}")
    print(f"Selfie: {os.path.basename(selfie_path)}")
    print()
    
    # Run multiple times to check for consistency
    for i in range(5):
        print(f"--- Run {i+1} ---")
        verifier = FaceVerificationSystem()
        result = verifier.verify_faces(gov_id_path, selfie_path)
        
        if result["success"]:
            match_score = result["match_score"]
            is_verified = result["is_verified"]
            print(f"Match Score: {match_score * 100:.2f}%")
            print(f"Verified: {'YES' if is_verified else 'NO'}")
        else:
            print(f"Error: {result['error']}")
        print()

if __name__ == "__main__":
    compare_results()
