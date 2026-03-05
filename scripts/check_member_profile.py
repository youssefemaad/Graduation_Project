import psycopg2

# Database connection parameters
conn_params = {
    'host': 'localhost',
    'port': 5432,
    'database': 'PulseGym_v1.0.1',
    'user': 'postgres',
    'password': '123'
}

try:
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor()

    # Get column names for member_profiles table
    cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'member_profiles'
        ORDER BY ordinal_position
    """)

    columns = cursor.fetchall()

    print(f"Member_profiles table columns:")
    for col in columns:
        print(f"  - {col[0]} ({col[1]}) nullable={col[2]} default={col[3]}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
