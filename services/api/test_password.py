#!/usr/bin/env python3
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from core.security import get_password_hash, verify_password

def test_password_hashing():
    test_password = "password123"
    print(f"Testing password: '{test_password}'")
    print(f"Password length: {len(test_password)}")
    print(f"Password bytes: {len(test_password.encode('utf-8'))}")
    
    try:
        hashed = get_password_hash(test_password)
        print(f"✅ Hash successful: {hashed}")
        
        # Test verification
        is_valid = verify_password(test_password, hashed)
        print(f"✅ Verification: {is_valid}")
        
        return True
    except Exception as e:
        print(f"❌ Hashing failed: {e}")
        return False

if __name__ == "__main__":
    test_password_hashing()