import os
import sys

# Ensure backend root is in path for imports
sys.path.append(os.getcwd())

try:
    from core.database import SessionLocal
    from models.all_models import Notification, User
    print("Imports successful.")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

db = SessionLocal()
try:
    print("--- Diagnostic Run Start ---")
    
    # Check if a user exists to associate with the notification
    user = db.query(User).first()
    if not user:
        print("Warning: No users found in database. Creating test notification with user_id=1.")
        uid = 1
    else:
        uid = user.id
        print(f"Using existing user ID: {uid}")

    # Attempt to create the actionable notification
    print(f"Attempting to create Notification for user_id={uid}...")
    n = Notification(
        user_id=uid, 
        message='Diagnostic Connection Check', 
        type='match_request', 
        payload_id=999
    )
    db.add(n)
    db.commit()
    print("SUCCESS: Notification logic is robust.")
    
except Exception as e:
    print("\n--- FAILURE DETECTED ---")
    print(f"Error Message: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
    print("--- Diagnostic Run End ---")
