import sys
import os

# Ensure backend root is in the Python path
sys.path.append(os.getcwd())

try:
    from core.database import engine, Base
    # Correcting the import names to match models/all_models.py exactly
    from models.all_models import (
        User, Preference, Availability, StudyGroup, 
        StudySession, Membership, Notification, GroupMessage, StudyInsight
    )
    print("Successfully imported all database models.")
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def complete_schema():
    print("Initializing Global Database Restoration...")
    try:
        # Base.metadata.create_all only creates tables that do NOT already exist.
        Base.metadata.create_all(bind=engine)
        print("SUCCESS: All missing tables (including 'study_sessions') have been synchronized and created.")
    except Exception as e:
        print(f"CRITICAL ERROR during schema restoration: {e}")

if __name__ == "__main__":
    complete_schema()
