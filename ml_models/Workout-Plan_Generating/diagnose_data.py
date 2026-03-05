"""Diagnose training data quality issues"""
import json

with open("data/exercises_final.json", "r", encoding="utf-8") as f:
    exs = json.load(f)

# 1. Equipment field accuracy
equip_counts = {}
wrong_equip = []
for ex in exs:
    eq = ex.get("equipment", "")
    equip_counts[eq] = equip_counts.get(eq, 0) + 1
    name = ex["name"].lower()
    if eq == "body only":
        if "barbell" in name:
            wrong_equip.append(f"  {ex['name']} -> {eq}")
        elif "dumbbell" in name:
            wrong_equip.append(f"  {ex['name']} -> {eq}")
        elif "cable" in name:
            wrong_equip.append(f"  {ex['name']} -> {eq}")
        elif "machine" in name:
            wrong_equip.append(f"  {ex['name']} -> {eq}")
        elif "kettlebell" in name:
            wrong_equip.append(f"  {ex['name']} -> {eq}")
        elif "band" in name and "body" not in name:
            wrong_equip.append(f"  {ex['name']} -> {eq}")

print("=== EQUIPMENT DISTRIBUTION ===")
for k, v in sorted(equip_counts.items(), key=lambda x: -x[1]):
    print(f"  {k}: {v}")

print(
    f"\n=== WRONG EQUIPMENT (name says X, field says body only): {len(wrong_equip)} ===")
for w in wrong_equip[:25]:
    print(w)

# 2. Mechanic field
mech_counts = {}
for ex in exs:
    m = ex.get("mechanic", "unknown")
    mech_counts[m] = mech_counts.get(m, 0) + 1
print(f"\n=== MECHANIC DISTRIBUTION ===")
for k, v in sorted(mech_counts.items(), key=lambda x: -x[1]):
    print(f"  {k}: {v}")

# 3. Stretches / non-training exercises
bad_keywords = ["stretch", "warmup", "warm up",
                "foam", "mobility", "static hold", "cool down"]
stretches = [ex["name"] for ex in exs if any(
    k in ex["name"].lower() for k in bad_keywords)]
print(f"\n=== NON-TRAINING EXERCISES ({len(stretches)}) ===")
for s in stretches:
    print(f"  {s}")

# 4. Check some specific exercises from the bad CSV output
check_names = [
    "Incline Bench Press – Dumbbell",
    "Shoulder Press – Machine",
    "Arnold Press",
    "Seated Calf Stretch",
    "Dynamic Back Stretch",
    "Chest Stretch on Stability Ball",
    "Kneeling Hip Flexor",
    "Eccentric Leg Extension",
    "Chest Fly – Machine",
]
print(f"\n=== SPOT CHECK EXERCISES ===")
name_map = {ex["name"]: ex for ex in exs}
for n in check_names:
    ex = name_map.get(n)
    if ex:
        print(f"  {n}")
        print(f"    equipment: {ex.get('equipment')}")
        print(f"    mechanic: {ex.get('mechanic')}")
        print(f"    category: {ex.get('category')}")
        print(f"    muscles: {ex.get('primaryMuscles')}")
        print(f"    pattern: {ex.get('movement_pattern')}")
    else:
        print(f"  {n} -> NOT FOUND")

# 5. Category distribution (some may be stretching category)
cat_counts = {}
for ex in exs:
    c = ex.get("category", "unknown")
    cat_counts[c] = cat_counts.get(c, 0) + 1
print(f"\n=== CATEGORY DISTRIBUTION ===")
for k, v in sorted(cat_counts.items(), key=lambda x: -x[1]):
    print(f"  {k}: {v}")
