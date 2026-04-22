import psycopg2

def check_everything():
    db_name = "study_platform;"
    password = "Fasmina1209"
    
    for port in [5000, 5432, 5433]:
        print(f"\n--- Checking Port {port} ---")
        try:
            # 1. Check if server is up
            conn = psycopg2.connect(
                user="postgres",
                password=password,
                host="localhost",
                port=port,
                dbname="postgres" # connect to maintenance DB first
            )
            print(f"  Connection to Postgres server: SUCCESS")
            
            # 2. List databases
            cur = conn.cursor()
            cur.execute("SELECT datname FROM pg_database")
            dbs = [r[0] for r in cur.fetchall()]
            print(f"  Databases: {dbs}")
            
            # 3. Check specific database
            if db_name in dbs:
                conn_db = psycopg2.connect(
                    user="postgres",
                    password=password,
                    host="localhost",
                    port=port,
                    dbname=db_name
                )
                cur_db = conn_db.cursor()
                cur_db.execute("SELECT COUNT(*) FROM users")
                count = cur_db.fetchone()[0]
                print(f"  SUCCESS! Database '{db_name}' has {count} users.")
                cur_db.close()
                conn_db.close()
            else:
                print(f"  Database '{db_name}' not found on this port.")
                
            cur.close()
            conn.close()
            
        except Exception as e:
            print(f"  Port {port} Error: {e}")

if __name__ == "__main__":
    check_everything()
