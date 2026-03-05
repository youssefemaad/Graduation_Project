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

    # Get column names for users table
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
    """)

    columns = cursor.fetchall()

    print(f"\nUsers table columns:")
    for col in columns:
        print(f"  - {col[0]} ({col[1]}) nullable={col[2]}")

    # Also check workout_plans
    cursor.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'workout_plans'
        ORDER BY ordinal_position
    """)

    wp_columns = cursor.fetchall()

    print(f"\nWorkout_plans table columns:")
    for col in wp_columns:
        print(f"  - {col[0]} ({col[1]})")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
