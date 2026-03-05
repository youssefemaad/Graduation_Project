import psycopg2
import os

DB_HOST = "localhost"
DB_NAME = "PulseGym_v1.0.1"
DB_USER = "postgres"
DB_PASS = "123"
DB_PORT = "5432"

SQL_FILE = r"d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\Documentation\SeedData_Exercises_Generated_V2.sql"
CATEGORY_SQL_FILE = r"d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\Documentation\SeedData_EquipmentCategories.sql"

def execute_sql_file():
    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()

        # 1. Execute Categories
        print(f"Reading SQL file from: {CATEGORY_SQL_FILE}")
        with open(CATEGORY_SQL_FILE, 'r', encoding='utf-8') as f:
            sql = f.read()
            cur.execute(sql)
            print("Categories seeded.")

        # 2. Execute Main Script
        print(f"Reading SQL file from: {SQL_FILE}")
        
        # Read file line by line and accumulate statements
        # This is safer for large inserts
        statement = ""
        count = 0
        total_lines = 0
        
        with open(SQL_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                stripped = line.strip()
                if not stripped or stripped.startswith("--"):
                    continue
                
                statement += line
                if stripped.endswith(";"):
                    try:
                        cur.execute(statement)
                        count += 1
                        if count % 100 == 0:
                            print(f"Executed {count} statements...", end='\r')
                        statement = ""
                    except Exception as e:
                        print(f"\nError executing statement at count {count}:\n{statement[:100]}...\nError: {e}")
                        # Depending on error, we might want to continue or stop. 
                        # For now, let's stop on error to be safe, or just print and continue?
                        # Seeding often has some duplicates or issues, maybe continue? 
                        # But foreign key errors are critical.
                        # Let's stop.
                        raise e
        
        print(f"\nSuccessfully executed {count} SQL statements.")
        
    except Exception as e:
        import traceback
        print(f"\nFailed to execute SQL script. Exception type: {type(e)}")
        print(f"Exception message: {str(e)}")
        traceback.print_exc()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    execute_sql_file()
