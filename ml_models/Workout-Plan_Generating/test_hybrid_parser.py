"""
Test the hybrid parser with the actual model output
"""
import re
import json
from typing import Dict, Any

# The actual model output we observed
model_output = '''"plan_name": "3-Day Muscle Push/Pull/Legs", "fitness_level": "Beginner", "goal": "Muscle", "days_per_week": 3, "program_duration_weeks": 6, "days": ["day_number": 1, "day_name": "Day 1: Push", "focus_areas": ["chest", "shoulders", "triceps"], "estimated_duration_minutes": 69, "exercises": ["name": "Flat Db Press", "sets": "2", "reps": "6-10", "rest": "90 sec", "target_muscles": ["chest", "triceps", "front delts"], "equipment": "dumbbell", "movement_pattern": "horizontal_push", "exercise_type": "compound", "notes": "Mind-muscle connection", "name": "Sternal Push-Up", "sets": "3", "reps": "15-20", "rest": "90 sec", "target_muscles": ["chest", "triceps"], "equipment": "body weight", "movement_pattern": "horizontal_push", "exercise_type": "compound", "notes": "Focus on controlled movement", "name": "Ng Shoulder Press Machine", "sets": "2", "reps": "6-10", "rest": "90 sec", "target_muscles": ["shoulders", "triceps"], "equipment": "leverage machine", "movement_pattern": "vertical_push", "exercise_type": "compound", "notes": "Mind-muscle connection"]]'''


def extract_workout_from_model_output(text: str, req_days: int = 4, req_goal: str = "Muscle", req_level: str = "Intermediate") -> Dict[str, Any]:
    """
    Extract workout data from ML model output and build a structured plan.
    """
    
    # Extract plan name
    plan_name_match = re.search(r'"plan_name":\s*"([^"]+)"', text)
    plan_name = plan_name_match.group(1) if plan_name_match else f"AI {req_goal} Plan"
    
    # Extract exercises - look for patterns like "name": "Exercise Name"
    exercises_data = []
    
    # Pattern to match exercise data
    exercise_pattern = r'"name":\s*"([^"]+)"[^}]*?"sets":\s*"?(\d+)"?[^}]*?"reps":\s*"([^"]+)"[^}]*?"rest":\s*"([^"]+)"'
    
    for match in re.finditer(exercise_pattern, text):
        exercise = {
            "name": match.group(1),
            "sets": match.group(2),
            "reps": match.group(3),
            "rest": match.group(4)
        }
        
        # Try to extract additional fields
        search_window = text[match.start():min(len(text), match.start() + 300)]
        
        muscles_match = re.search(r'"target_muscles":\s*\[([^\]]+)\]', search_window)
        if muscles_match:
            muscles = re.findall(r'"([^"]+)"', muscles_match.group(1))
            exercise["target_muscles"] = muscles
        
        equipment_match = re.search(r'"equipment":\s*"([^"]+)"', search_window)
        if equipment_match:
            exercise["equipment"] = equipment_match.group(1)
        
        notes_match = re.search(r'"notes":\s*"([^"]+)"', search_window)
        if notes_match:
            exercise["notes"] = notes_match.group(1)
            
        exercises_data.append(exercise)
    
    print(f"📊 Extracted {len(exercises_data)} exercises from model output")
    
    # Extract day information
    days_data = []
    day_pattern = r'"day_number":\s*(\d+)[^}]*?"day_name":\s*"([^"]+)"[^}]*?"focus_areas":\s*\[([^\]]+)\]'
    
    day_matches = list(re.finditer(day_pattern, text))
    
    if day_matches:
        # We found day structures in the output
        for i, match in enumerate(day_matches):
            day_number = int(match.group(1))
            day_name = match.group(2)
            focus_areas_str = match.group(3)
            focus_areas = re.findall(r'"([^"]+)"', focus_areas_str)
            
            # Get exercises for this day
            start_pos = match.end()
            end_pos = day_matches[i + 1].start() if i + 1 < len(day_matches) else len(text)
            day_text = text[start_pos:end_pos]
            
            day_exercises = []
            for ex_match in re.finditer(exercise_pattern, day_text):
                day_exercises.append({
                    "name": ex_match.group(1),
                    "sets": ex_match.group(2),
                    "reps": ex_match.group(3),
                    "rest": ex_match.group(4)
                })
            
            days_data.append({
                "day_number": day_number,
                "day_name": day_name,
                "focus_areas": focus_areas,
                "exercises": day_exercises if day_exercises else exercises_data[i*3:(i+1)*3] if exercises_data else []
            })
    else:
        # No day structure found, create days from exercises
        exercises_per_day = max(4, len(exercises_data) // req_days) if exercises_data else 4
        
        day_templates = {
            3: [("Push Day", ["chest", "shoulders", "triceps"]),
                ("Pull Day", ["back", "biceps"]),
                ("Leg Day", ["quads", "hamstrings", "glutes"])],
            4: [("Upper Push", ["chest", "shoulders", "triceps"]),
                ("Lower", ["quads", "hamstrings", "glutes"]),
                ("Upper Pull", ["back", "biceps"]),
                ("Full Body", ["core", "cardio"])],
        }
        
        templates = day_templates.get(req_days, day_templates[4])
        
        for i in range(req_days):
            template = templates[i % len(templates)]
            start_idx = i * exercises_per_day
            end_idx = start_idx + exercises_per_day
            day_exercises = exercises_data[start_idx:end_idx] if exercises_data else []
            
            days_data.append({
                "day_number": i + 1,
                "day_name": f"Day {i + 1}: {template[0]}",
                "focus_areas": template[1],
                "exercises": day_exercises
            })
    
    # Build final plan structure
    plan = {
        "plan_name": plan_name,
        "fitness_level": req_level,
        "goal": req_goal,
        "days_per_week": req_days,
        "program_duration_weeks": 8,
        "days": days_data,
        "notes": "Generated by AI - exercises extracted from model output"
    }
    
    return plan


# Test the parser
print("=" * 80)
print("TESTING HYBRID PARSER")
print("=" * 80)

plan = extract_workout_from_model_output(model_output, req_days=3, req_goal="Muscle", req_level="Beginner")

print("\n" + "=" * 80)
print("PARSED PLAN:")
print("=" * 80)
print(json.dumps(plan, indent=2))

# Validate structure
total_exercises = sum(len(day.get("exercises", [])) for day in plan.get("days", []))
print(f"\n✅ Total exercises extracted: {total_exercises}")
print(f"✅ Total days: {len(plan['days'])}")

for day in plan['days']:
    print(f"   Day {day['day_number']}: {day['day_name']} - {len(day['exercises'])} exercises")
    for ex in day['exercises'][:2]:
        print(f"      - {ex['name']}: {ex['sets']} sets x {ex['reps']}")
