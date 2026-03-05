"""
Quick test: verify the model generates a plan and all days get populated.
Run from the Workout-Plan_Generating directory:
    python test_full_plan.py
"""
import re
from peft import PeftModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import sys
import os
import json
import time
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "models", "workout-generator-v3")
BASE_MODEL = "google/flan-t5-small"

# ── Load model ──
print("⏳ Loading model...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
base_model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL)
model = PeftModel.from_pretrained(base_model, MODEL_DIR)
model.eval()
print("✅ Model loaded\n")

# ── Load exercise DB (same one used by the API) ──
DB_PATH = os.path.join(SCRIPT_DIR, "data", "exercises_comprehensive_real.json")
with open(DB_PATH, "r", encoding="utf-8") as f:
    EXERCISE_DB = json.load(f)
print(f"✅ Loaded {len(EXERCISE_DB)} exercises from DB\n")

# Index by muscle
DB_BY_MUSCLE = {}
for ex in EXERCISE_DB:
    for m in ex.get("targetMuscles", []):
        DB_BY_MUSCLE.setdefault(m.lower(), []).append(ex)

# ── Training-format prompt (matches what model was trained on) ──
prompt = "Generate a 4-day workout plan for intermediate lifter, goal is muscle, has access to barbell, dumbbell, cable, machine."

print(f"📝 Prompt: {prompt}\n")

# ── Generate ──
start = time.time()
inputs = tokenizer(prompt, return_tensors="pt",
                   max_length=256, truncation=True, padding=True)
with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_length=1024,
        num_beams=2,
        early_stopping=True,
        do_sample=False,
    )
raw = tokenizer.decode(outputs[0], skip_special_tokens=True)
gen_time = time.time() - start

print(f"⏱️  Generation time: {gen_time:.1f}s")
print(f"📄 Output length: {len(raw)} chars")
print(
    f"📄 Raw output:\n{raw[:500]}\n{'...(truncated)' if len(raw) > 500 else ''}\n")

# ── Parse exercises with regex ──
exercise_pattern = r'"name":\s*"([^"]+)".*?"sets":\s*"?(\d+)"?.*?"reps":\s*"([^"]+)".*?"rest":\s*"([^"]+)"'
day_pattern = r'"day_number":\s*(\d+).*?"day_name":\s*"([^"]+)".*?"focus_areas":\s*\[([^\]]+)\]'

exercises = list(re.finditer(exercise_pattern, raw))
days = list(re.finditer(day_pattern, raw))

print(f"📊 Parsed {len(exercises)} exercises, {len(days)} day structures\n")

# ── Show what the model generated ──
for i, m in enumerate(exercises):
    print(
        f"   Exercise {i+1}: {m.group(1)} | sets={m.group(2)} reps={m.group(3)} rest={m.group(4)}")

# ── Day templates for 4-day plan (matching training splits) ──
day_templates = [
    ("Push", ["chest", "shoulders", "triceps"]),
    ("Pull", ["back", "biceps", "rear delts"]),
    ("Legs", ["quads", "hamstrings", "glutes", "calves"]),
    ("Upper Mix", ["chest", "back", "shoulders"]),
]

# ── Fill underpopulated days from DB ──
print(f"\n{'='*50}")
print("Simulating day-filling from exercise DB...")
print(f"{'='*50}\n")

used_names = set(m.group(1).lower() for m in exercises)

for i, (name, focus_areas) in enumerate(day_templates):
    # Count model-generated exercises for this day
    day_exercises_count = 0
    if i < len(days):
        # Count exercises between this day marker and the next
        start_pos = days[i].end()
        end_pos = days[i+1].start() if i+1 < len(days) else len(raw)
        segment = raw[start_pos:end_pos]
        day_exercises_count = len(list(re.finditer(exercise_pattern, segment)))

    print(f"Day {i+1}: {name} (focus: {', '.join(focus_areas)})")
    print(f"   Model generated: {day_exercises_count} exercises")

    if day_exercises_count < 4:
        # Pick from DB
        candidates = []
        for focus in focus_areas:
            fl = focus.lower()
            for mk, exs in DB_BY_MUSCLE.items():
                if fl in mk or mk in fl:
                    candidates.extend(exs)

        seen = set()
        unique = []
        for ex in candidates:
            n = ex["name"].lower()
            if n not in seen and n not in used_names:
                seen.add(n)
                unique.append(ex)

        unique.sort(key=lambda x: x.get("goal_suitability",
                    {}).get("Muscle", 5), reverse=True)
        needed = 5 - day_exercises_count
        filled = unique[:needed]

        for ex in filled:
            used_names.add(ex["name"].lower())
            print(
                f"   + DB fill: {ex['name'].title()} ({ex.get('equipments', ['?'])[0]})")

        print(f"   Total after fill: {day_exercises_count + len(filled)}")
    else:
        print(f"   ✅ Sufficient!")

print(f"\n{'='*50}")
print("✅ Test complete!")
print(f"{'='*50}")
