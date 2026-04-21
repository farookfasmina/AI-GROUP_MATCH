import sqlite3
import os

db_path = 'app.db'
if not os.path.exists(db_path):
    print(f"Error: Database {db_path} not found.")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute('PRAGMA table_info(notifications)')
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'type' not in columns:
        print("Adding 'type' column...")
        cursor.execute('ALTER TABLE notifications ADD COLUMN type VARCHAR DEFAULT "general"')
    
    if 'payload_id' not in columns:
        print("Adding 'payload_id' column...")
        cursor.execute('ALTER TABLE notifications ADD COLUMN payload_id INTEGER')
    
    conn.commit()
    print("Database migration successful.")
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
    exit(1)
