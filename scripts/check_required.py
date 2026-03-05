import psycopg2

conn = psycopg2.connect(host='localhost', port=5432,
                        database='PulseGym_v1.0.1', user='postgres', password='123')
cursor = conn.cursor()

cursor.execute("""
    SELECT column_name, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name='workout_plans' AND is_nullable='NO'
    ORDER BY ordinal_position
""")

print("Workout_plans NOT NULL columns:")
for col in cursor.fetchall():
    print(f"  - {col[0]} (default={col[2]})")

cursor.close()
conn.close()
