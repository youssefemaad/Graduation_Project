import psycopg2

# Database connection parameters
conn_params = {
    'host': 'localhost',
    'port': 5432,
    'database': 'PulseGym_v1.0.1',
    'user': 'postgres',
    'password': '123'
}

print("Connecting to database...")
try:
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor()

    # Get all table names
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)

    tables = [row[0] for row in cursor.fetchall()]

    print(f"\nFound {len(tables)} tables in PulseGym_v1.0.1:")
    for table in tables:
        print(f"  - {table}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
