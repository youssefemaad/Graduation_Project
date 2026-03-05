import psycopg2

conn = psycopg2.connect(host='localhost', port=5432,
                        database='PulseGym_v1.0.1', user='postgres', password='123')
cursor = conn.cursor()

# Check coach_profiles primary key
cursor.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='coach_profiles'
    ORDER BY ordinal_position
""")

print("Coach_profiles columns:")
for col in cursor.fetchall():
    print(f"  - {col[0]}")

# Check exercises FK constraint
cursor.execute("""
    SELECT
        tc.constraint_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'exercises' AND tc.constraint_type = 'FOREIGN KEY'
""")

print("\nExercises FK constraints:")
for fk in cursor.fetchall():
    print(f"  - {fk[0]}: {fk[1]} → {fk[2]}.{fk[3]}")

cursor.close()
conn.close()
