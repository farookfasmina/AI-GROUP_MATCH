import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal, engine
from core.security import verify_password
from models.all_models import User

def check_login_failure():
    print("--- STARTING LOGIN DIAGNOSTICS ---")
    db = SessionLocal()
    try:
        # Check connection
        db.execute(text("SELECT 1"))
        print("1. Database Connection: SUCCESS")
        
        # Check user
        email = "james80@example.net"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"2. User Check: FAILURE (User {email} not found)")
            return
        
        print(f"2. User Check: SUCCESS (User {email} found with ID {user.id})")
        
        # Check password verification
        # Assuming the password is 'password123'
        try:
            is_valid = verify_password("password123", user.hashed_password)
            print(f"3. Password Verification: {'SUCCESS' if is_valid else 'FAILURE'}")
        except Exception as e:
            print(f"3. Password Verification: CRASH ({str(e)})")
            import traceback
            traceback.print_exc()

        # Check for any potential issues with models (e.g. missing columns)
        print("4. Model Consistency Check: START")
        # Try to access all common properties
        print(f"   - Full Name: {user.full_name}")
        print(f"   - Admin Status: {user.is_admin}")
        print(f"   - Platform Admin: {user.is_platform_admin}")
        print("4. Model Consistency Check: SUCCESS")

    except Exception as e:
        print(f"CRITICAL ERROR during diagnostics: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
    print("--- DIAGNOSTICS COMPLETE ---")

if __name__ == "__main__":
    check_login_failure()
