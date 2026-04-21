import psycopg2

def list_databases_and_tables():
    try:
        conn = psycopg2.connect(
            dbname='postgres', 
            user='postgres', 
            password='Fasmina1209', 
            host='localhost', 
            port='5000'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("--- Databases ---")
        cur.execute("SELECT datname FROM pg_database;")
        databases = cur.fetchall()
        for db in databases:
            print(f"DB: {db[0]}")
        
        for db in databases:
            db_name = db[0]
            if db_name in ['postgres', 'template1', 'template2']:
                continue
            
            print(f"\n--- Tables in {db_name} ---")
            try:
                db_conn = psycopg2.connect(
                    dbname=db_name, 
                    user='postgres', 
                    password='Fasmina1209', 
                    host='localhost', 
                    port='5000'
                )
                db_cur = db_conn.cursor()
                db_cur.execute("SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');")
                tables = db_cur.fetchall()
                for table in tables:
                    print(f"  Table: {table[0]} (Schema: {table[1]})")
                db_conn.close()
            except Exception as e:
                print(f"  Could not connect to {db_name}: {e}")
                
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    list_databases_and_tables()
