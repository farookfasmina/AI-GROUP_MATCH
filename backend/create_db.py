import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    # Connect to default postgres database to create the new one
    conn = psycopg2.connect(
        dbname='postgres', 
        user='postgres', 
        password='Fasmina1209', 
        host='localhost', 
        port='5000'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'study_platform'")
    exists = cursor.fetchone()
    
    if not exists:
        print("Creating database 'study_platform'...")
        cursor.execute("CREATE DATABASE study_platform")
        print("Database created successfully.")
    else:
        print("Database 'study_platform' already exists.")
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    create_database()
