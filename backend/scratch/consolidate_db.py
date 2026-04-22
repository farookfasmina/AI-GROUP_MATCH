import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def consolidate():
    dsn = "postgresql://postgres:Fasmina1209@localhost:5000/postgres"
    print(f"Connecting to {dsn}...")
    try:
        conn = psycopg2.connect(dsn)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # 1. Terminate all connections to both databases
        print("Kicking off active connections from 'study_platform' and 'study_platform;'...")
        for name in ['study_platform', 'study_platform;']:
            cur.execute("""
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = %s AND pid <> pg_backend_pid();
            """, (name,))
            
        # 2. DROP the 53-user database
        print("Dropping the small 53-user database ('study_platform')...")
        cur.execute("DROP DATABASE IF EXISTS study_platform;")
        
        # 3. RENAME the 164-user database
        print("Renaming the real 164-user database ('study_platform;') to the clean name...")
        # Since the name has a semicolon, it MUST be double-quoted in SQL
        cur.execute('ALTER DATABASE "study_platform;" RENAME TO study_platform;')
        
        print("\nSUCCESS! Your 164 users are now in the 'study_platform' database.")
    except Exception as e:
        print(f"\nERROR during consolidation: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    consolidate()
