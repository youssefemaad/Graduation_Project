import json
import os

# Paths
base_dir = os.path.dirname(__file__)
json_comprehensive = os.path.join(base_dir, 'data', 'exercises_comprehensive_real.json')
json_sample = os.path.join(base_dir, 'data', 'exercisedb_v1_sample', 'exercises.json')
json_equipment_list = os.path.join(base_dir, 'data', 'Dataset_with_BodyParts', 'all_equipment.json')
output_path = os.path.join(base_dir, '..', '..', 'Documentation', 'SeedData_Exercises_Generated_V2.sql')

# Load Data
print("Loading data...")
with open(json_comprehensive, 'r', encoding='utf-8') as f:
    exercises_comp = json.load(f)

with open(json_sample, 'r', encoding='utf-8') as f:
    exercises_sample = json.load(f)

with open(json_equipment_list, 'r', encoding='utf-8') as f:
    equipment_ref_list = json.load(f)

print(f"Loaded {len(exercises_comp)} comprehensive exercises and {len(exercises_sample)} sample exercises.")

# --- EQUIPMENT PROCESSING ---
# 1. Base Categories (mapped to IDs)
# 1: Cardio, 2: Strength Machines, 3: Free Weights, 4: Bodyweight/Misc
equipment_category_map = {
    'treadmill': 1, 'stationary bike': 1, 'elliptical': 1, 'rowing machine': 1, 'stairmill': 1,
    'dumbbell': 3, 'barbell': 3, 'kettlebell': 3, 'ez barbell': 3, 'olympic barbell': 3, 'trap bar': 3,
    'cable': 2, 'leverage machine': 2, 'smith machine': 2, 'sled machine': 2, 'plate loaded': 2,
    'body weight': 4, 'band': 3, 'resistance band': 3, 'stability ball': 4, 'bosu ball': 4, 
    'medicine ball': 4, 'suspension': 4, 'rope': 4, 'battling rope': 1, 'roll': 4, 'stick': 4,
    'weighted': 4, 'assisted': 2, 'wheel roller': 4
}
default_cat_id = 4

# 2. Collect all unique equipment names
unique_equipment = {} # name_lower -> proper_name

# From reference list
for item in equipment_ref_list:
    name = item.get('name', '').strip()
    if name:
        unique_equipment[name.lower()] = name.title()

# Add standard gym equipment explicitly if missing
base_items = ['Treadmill', 'Stationary Bike', 'Squat Rack', 'Bench Press Station']
for item in base_items:
    if item.lower() not in unique_equipment:
        unique_equipment[item.lower()] = item

# From exercises (scan for missing ones)
for ex in exercises_comp + exercises_sample:
    eq_list = ex.get('equipments', [])
    if isinstance(eq_list, list):
        for eq in eq_list:
            if eq and isinstance(eq, str):
                eq_clean = eq.strip().lower()
                if eq_clean and eq_clean not in unique_equipment:
                    unique_equipment[eq_clean] = eq.title()

print(f"Found {len(unique_equipment)} unique equipment items.")

# --- EXERCISE PROCESSING ---
unique_exercises = {} # name_lower -> exercise_obj

# Helper to process an exercise object
def process_exercise(ex, source_priority):
    name = ex.get('name', 'Unknown').strip()
    if not name: return
    name_key = name.lower()
    
    # Validation: skip if duplicates and we want to keep the "better" one? 
    # For now, simpler: first comes first, or overwrite? 
    # Sample has images/gifs and secondary muscles, so it's high quality.
    # Comprehensive is huge.
    # We'll use the one with non-empty secondary muscles or instructions as 'better'.
    
    existing = unique_exercises.get(name_key)
    
    # Normalize fields
    instructions = ""
    raw_instr = ex.get('instructions', [])
    if isinstance(raw_instr, list):
        instructions = " ".join([f"Step:{i+1} {step}" for i, step in enumerate(raw_instr)])
    elif isinstance(raw_instr, str):
        instructions = raw_instr
    
    # Secondary Muscles
    sec_muscles = ex.get('secondaryMuscles', [])
    if isinstance(sec_muscles, list):
        sec_muscles_str = ", ".join(sec_muscles)
    else:
        sec_muscles_str = ""
        
    description = name
    if sec_muscles_str:
        description += f". Secondary Muscles: {sec_muscles_str}"
        
    # Primary Muscle
    muscle_group = ""
    targets = ex.get('targetMuscles', [])
    bodyparts = ex.get('bodyParts', [])
    if targets and len(targets) > 0 and targets[0]:
        muscle_group = targets[0].title()
    elif bodyparts and len(bodyparts) > 0 and bodyparts[0]:
        muscle_group = bodyparts[0].title()
    
    if not muscle_group or not muscle_group.strip():
        muscle_group = 'Unspecified'
        
    # Equipment
    eq_required = "body weight"
    eqs = ex.get('equipments', [])
    if eqs and len(eqs) > 0 and eqs[0]:
        eq_required = eqs[0]
        
    ex_data = {
        'name': name,
        'description': description, # Stores name + secondary info
        'muscle_group': muscle_group,
        'instructions': instructions,
        'equipment_required': eq_required,
        'category': 'Cardio' if 'cardio' in (ex.get('bodyParts', []) or []) else 'Strength'
    }
    
    if existing:
        # Overwrite if current has secondary muscles and existing doesn't
        if "Secondary Muscles" in description and "Secondary Muscles" not in existing['description']:
            unique_exercises[name_key] = ex_data
    else:
        unique_exercises[name_key] = ex_data

# Process Sample first (higher quality?)
for ex in exercises_sample:
    process_exercise(ex, 1)

# Process Comprehensive
for ex in exercises_comp:
    process_exercise(ex, 2)

print(f"Processed {len(unique_exercises)} unique exercises.")

# --- SQL GENERATION ---
print("Generating SQL...")
with open(output_path, 'w', encoding='utf-8') as f_out:
    f_out.write("-- Generated Seed Data V2 (Comprehensive)\n")
    f_out.write("TRUNCATE TABLE exercises, equipment RESTART IDENTITY CASCADE;\n\n")

    # Equipment INSERTs
    f_out.write("-- EQUIPMENT\n")
    # Sort for consistency
    sorted_eq = sorted(unique_equipment.items())
    
    for eq_key, eq_name in sorted_eq:
        # Determine category
        # Simple keyword matching
        cat_id = default_cat_id
        for key, cid in equipment_category_map.items():
            if key in eq_key:
                cat_id = cid
                break
        
        # Escape
        safe_name = eq_name.replace("'", "''")
        f_out.write(f"INSERT INTO equipment (\"CategoryId\", \"Name\", \"Status\", \"BookingCostTokens\", \"IsActive\", \"CreatedAt\", \"UpdatedAt\") VALUES ({cat_id}, '{safe_name}', 0, 0, true, NOW(), NOW());\n")

    f_out.write("\n-- EXERCISES\n")
    
    count = 0
    for key, data in unique_exercises.items():
        name = data['name'].replace("'", "''")
        desc = data['description'].replace("'", "''")
        cat = data['category']
        muscle = data['muscle_group'].replace("'", "''")
        diff = "Intermediate"
        instr = data['instructions'].replace("'", "''")
        
        # Resolve Equipment ID
        req_eq_name = data['equipment_required'].lower().replace("'", "''")
        # Try to match to one of our unique equipments
        # We need the exact string that was inserted. 
        # We used unique_equipment[eq_key] -> Title Case
        
        # find the title cased version in our map
        target_eq_name = unique_equipment.get(req_eq_name, 'Body Weight') # Fallback
        target_eq_name_safe = target_eq_name.replace("'", "''")
        
        cols = "\"Name\", \"Description\", \"Category\", \"MuscleGroup\", \"DifficultyLevel\", \"Instructions\", \"IsActive\", \"CreatedByCoachId\", \"CreatedAt\", \"UpdatedAt\", \"EquipmentId\", \"EquipmentRequired\""
        vals = f"'{name}', '{desc}', '{cat}', '{muscle}', '{diff}', '{instr}', true, 1, NOW(), NOW(), (SELECT \"EquipmentId\" FROM equipment WHERE \"Name\" = '{target_eq_name_safe}' LIMIT 1), '{req_eq_name}'"
        
        f_out.write(f"INSERT INTO exercises ({cols}) VALUES ({vals});\n")
        count += 1

print(f"Done. Generated {output_path}")


