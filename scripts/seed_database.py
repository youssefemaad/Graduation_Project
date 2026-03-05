import psycopg2
import sys

# Database connection parameters
conn_params = {
    'host': 'localhost',
    'port': 5432,
    'database': 'PulseGym_v1.0.1',
    'user': 'postgres',
    'password': '123'
}

# Read SQL file
sql_file = 'Documentation/SeedData_Minimal.sql'

print("Reading SQL file...")
with open(sql_file, 'r', encoding='utf-8') as f:
    sql_content = f.read()

print("Connecting to database...")
try:
    conn = psycopg2.connect(**conn_params)
    conn.autocommit = True
    cursor = conn.cursor()

    print("Connected successfully! Executing seed script...")
    cursor.execute(sql_content)

    print("✅ Seed script executed successfully!")

    # Verify user count
    cursor.execute('SELECT COUNT(*) FROM users')
    user_count = cursor.fetchone()[0]
    print(f"Total users in database: {user_count}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
