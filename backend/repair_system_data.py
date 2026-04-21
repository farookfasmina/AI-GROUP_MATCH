import sqlite3
import os
import sys

# Ensure backend root is in path to import security helpers
sys.path.append(os.getcwd())

from core.security import get_password_hash

def repair_user_data():
    db_path = "app.db"
    if not os.path.exists(db_path):
        print(f"Error: Database {db_path} not found.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Reset Password for the primary existing user
        target_email = "amandahutchinson@example.com"
        new_password = "Password123!"
        new_hash = get_password_hash(new_password)
        
        print(f"Repairing credentials for {target_email}...")
        cursor.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (new_hash, target_email))
        
        if cursor.rowcount == 0:
            print(f"Warning: User {target_email} not found. Creating a fresh victory account instead...")
            # Fallback: Create a user if they don't exist
            cursor.execute("INSERT INTO users (email, hashed_password, full_name, university, department, is_platform_admin) VALUES (?, ?, ?, ?, ?, ?)",
                           (target_email, new_hash, "Amanda Hutchinson", "University of Excellence", "Computer Science", 0))
        
        # 2. Find a target user for a connection
        cursor.execute("SELECT id FROM users WHERE email != ?", (target_email,))
        other_user = cursor.fetchone()
        
        if other_user:
            target_user_id = db_query_id(cursor, target_email)
            match_id = other_user[0]
            print(f"Injecting a 'Connected' bridge between ID {target_user_id} and ID {match_id}...")
            
            # Ensure the connection schedule part has a target group if needed
            # (Matches are calculated dynamically, but we'll ensure they are 'connected' if the logic requires it)
            # For this project, we'll ensure a private group exists between them
            group_name = f"Match: Amanda & Partner"
            cursor.execute("INSERT OR IGNORE INTO study_groups (name, description, subject, creator_id) VALUES (?, ?, ?, ?)",
                           (group_name, "Final Year Project Test Group", "Advanced Engineering", target_user_id))
            group_id = cursor.lastrowid
            
            # Add memberships to enable scheduling
            cursor.execute("INSERT OR IGNORE INTO memberships (user_id, group_id, role) VALUES (?, ?, ?)", (target_user_id, group_id, "admin"))
            cursor.execute("INSERT OR IGNORE INTO memberships (user_id, group_id, role) VALUES (?, ?, ?)", (match_id, group_id, "admin"))

        conn.commit()
        print("\nSUCCESS: User data repaired and connectivity injected.")
        print(f"LOGIN: {target_email} / {new_password}")
        conn.close()
    except Exception as e:
        print(f"CRITICAL REPAIR ERROR: {e}")

def db_query_id(cursor, email):
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    res = cursor.fetchone()
    return res[0] if res else None

if __name__ == "__main__":
    repair_user_data()
