import psycopg2
import os

# Base connection to 'postgres' to list other DBs
BASE_URL = "postgresql://postgres:Fasmina1209@localhost:5000/postgres"

def list_dbs():
    try:
        conn = psycopg2.connect(BASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        dbs = [row[0] for row in cur.fetchall()]
        print(f"Databases found: {dbs}")
        cur.close()
        conn.close()
        return dbs
    except Exception as e:
        print(f"Error listing databases: {e}")
        return []

def fix_it(db_name):
    # Construct URL with the literal name (we might need to quote it if it has a semicolon)
    # But psycopg2 usually handles the name in the connection call
    print(f"Attempting to fix columns in database: '{db_name}'")
    try:
        # Note: If the name has a semicolon, we might need to handle it carefully in the string
        conn = psycopg2.connect(
            dbname=db_name,
            user="postgres",
            password="Fasmina1209",
            host="localhost",
            port="5000"
        )
        cur = conn.cursor()
        
        # Check for preferences table
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'preferences');")
        if cur.fetchone()[0]:
            print(f"Table 'preferences' found in '{db_name}'. Fixing columns...")
            
            # Check for columns
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'preferences';")
            cols = [row[0] for row in cur.fetchall()]
            
            if 'preferred_study_type' not in cols:
                cur.execute("ALTER TABLE preferences ADD COLUMN preferred_study_type VARCHAR DEFAULT 'Group';")
                print("Added preferred_study_type.")
            
            if 'collaboration_tendency' not in cols:
                cur.execute("ALTER TABLE preferences ADD COLUMN collaboration_tendency VARCHAR DEFAULT 'Collaborative Peer';")
                print("Added collaboration_tendency.")
                
            conn.commit()
            print("Done with this DB.")
        else:
            print(f"Table 'preferences' NOT found in '{db_name}'.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Failed to fix '{db_name}': {e}")

if __name__ == "__main__":
    dbs = list_dbs()
    # Fix BOTH if they exist, to be absolutely safe
    if "study_platform" in dbs:
        fix_it("study_platform")
    if "study_platform;" in dbs:
        fix_it("study_platform;")
    
    # If the user says it's exactly "study_platform;", let's try to create it if it doesn't exist?
    # No, the backend's create_all should have done it if the connection was successful.
