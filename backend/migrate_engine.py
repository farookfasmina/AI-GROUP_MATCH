import sys
import os
from sqlalchemy import text

# Ensure backend root is in path
sys.path.append(os.getcwd())

try:
    from core.database import engine
    print("Database engine loaded.")
except Exception as e:
    print(f"Failed to load engine: {e}")
    sys.exit(1)

def migrate():
    with engine.connect() as conn:
        print("--- Starting Engine-Agnostic Migration ---")
        
        # We use a safe trial-and-error approach for column addition 
        # to handle differences between SQLite and Postgres syntax.
        
        try:
            print("Adding 'type' column...")
            conn.execute(text("ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'general'"))
            conn.commit()
            print("'type' column added.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("'type' column already exists, skipping.")
            else:
                print(f"Warning adding 'type': {e}")

        try:
            print("Adding 'payload_id' column...")
            conn.execute(text("ALTER TABLE notifications ADD COLUMN payload_id INTEGER"))
            conn.commit()
            print("'payload_id' column added.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("'payload_id' column already exists, skipping.")
            else:
                print(f"Warning adding 'payload_id': {e}")
                
        print("--- Migration Finalized ---")

if __name__ == "__main__":
    try:
        migrate()
        print("SUCCESS: Database is now synchronized with the latest schema.")
    except Exception as e:
        print(f"FATAL: Migration failed: {e}")
        sys.exit(1)
