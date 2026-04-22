import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from core.database import SessionLocal
    from models.all_models import User
    from core.security import get_password_hash
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def reset_passwords():
    print("--- Resetting Passwords for Key Users ---")
    db = SessionLocal()
    try:
        target_emails = ['james80@example.net', 'test@example.com']
        
        for email in target_emails:
            user = db.query(User).filter(User.email == email).first()
            if user:
                print(f"Updating user: {email}")
                user.hashed_password = get_password_hash("password123")
                # Also ensure they are active if there was such a field (there isn't)
                db.add(user)
                print(f"  New Hash: {user.hashed_password}")
            else:
                print(f"User not found: {email}")
        
        db.commit()
        print("Success: Passwords updated.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_passwords()
