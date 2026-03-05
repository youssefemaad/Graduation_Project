"""
More comprehensive JSON repair for ML model output
"""
import re
import json

# The actual model output pattern we observed
model_output = '''"plan_name": "3-Day Muscle Push/Pull/Legs", "fitness_level": "Beginner", "goal": "Muscle", "days_per_week": 3, "program_duration_weeks": 6, "days": ["day_number": 1, "day_name": "Day 1: Push", "focus_areas": ["chest", "shoulders", "triceps"], "estimated_duration_minutes": 69, "exercises": ["name": "Flat Db Press", "sets": "2", "reps": "6-10", "rest": "90 sec", "target_muscles": ["chest", "triceps", "front delts"], "equipment": "dumbbell", "movement_pattern": "horizontal_push", "exercise_type": "compound", "notes": "Mind-muscle connection", "name": "Sternal Push-Up", "sets": "3", "reps": "15-20", "rest": "90 sec", "target_muscles": ["chest", "triceps"], "equipment": "body weight", "movement_pattern": "horizontal_push", "exercise_type": "compound", "notes": "Focus on controlled movement"]]'''


def repair_ml_json(text: str) -> str:
    """
    Repair JSON output from ML model that has these specific issues:
    1. Missing outer braces
    2. Arrays containing key:value pairs instead of objects
    3. Missing object separators between items
    """
    text = text.strip()
    
    # Step 1: Add outer braces
    if not text.startswith('{'):
        text = '{' + text
    if not text.endswith('}'):
        text = text + '}'
    
    # Step 2: Fix array starts - arrays containing key:value should have object braces
    # ["key": value -> [{"key": value
    text = re.sub(r'\[\s*"([a-z_]+)":', r'[{"\1":', text)
    
    # Step 3: The hardest part - finding where one object ends and another begins
    # In "exercises" array, each exercise starts with "name":
    # In "days" array, each day starts with "day_number":
    
    # Find exercise boundaries: after "notes": "xxx" and before "name": 
    # This pattern: "notes": "something", "name": -> "notes": "something"}, {"name":
    text = re.sub(r'("notes":\s*"[^"]*"),\s*"name":', r'\1}, {"name":', text)
    
    # Find day boundaries: after exercises array closes and before "day_number":
    # Pattern: ]], "day_number": -> ]]}, {"day_number":
    text = re.sub(r'\]\],\s*"day_number":', r']}, {"day_number":', text)
    
    # Step 4: Fix the closing of objects before array close
    # "notes": "xyz"]] should be "notes": "xyz"}]]
    # But we need to be careful - might have nested arrays
    text = re.sub(r'("notes":\s*"[^"]*")\]\]', r'\1}]]', text)
    
    # Step 5: Ensure arrays are properly closed
    text = re.sub(r']\s*,\s*"day', '], "day', text)
    
    # Step 6: Count brackets and fix
    open_braces = text.count('{')
    close_braces = text.count('}')
    open_brackets = text.count('[')
    close_brackets = text.count(']')
    
    print(f"After repairs: {open_braces} {{ / {close_braces} }}, {open_brackets} [ / {close_brackets} ]")
    
    # Add missing closures - exercises array ends with }], days array ends with }]
    # So pattern at end should be }]}]}
    if open_brackets > close_brackets:
        text = text.rstrip('}')  # Remove any existing incomplete ending
        text += '}]' * (open_brackets - close_brackets)  # Close remaining arrays properly
        text += '}'  # Close outer object
    elif open_braces > close_braces:
        text += '}' * (open_braces - close_braces)
    
    return text


print("=" * 80)
print("TESTING JSON REPAIR")
print("=" * 80)

repaired = repair_ml_json(model_output)
print(f"\nRepaired ({len(repaired)} chars):")
print(repaired[:800])
print("...")

try:
    result = json.loads(repaired)
    print("\n" + "=" * 80)
    print("✅ SUCCESS! JSON parsed correctly!")
    print("=" * 80)
    print(f"Plan name: {result.get('plan_name')}")
    if 'days' in result:
        print(f"Days: {len(result['days'])}")
        for i, day in enumerate(result['days'][:2]):
            print(f"  Day {i+1}: {day.get('day_name')}")
            if 'exercises' in day:
                print(f"    Exercises: {len(day['exercises'])}")
except json.JSONDecodeError as e:
    print("\n" + "=" * 80)
    print(f"❌ FAILED: {e}")
    print("=" * 80)
    # Show where the error is
    start = max(0, e.pos - 50)
    end = min(len(repaired), e.pos + 50)
    print(f"Context around char {e.pos}:")
    print(repaired[start:end])
    print(" " * (e.pos - start) + "^-- ERROR HERE")
