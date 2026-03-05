"""
Generate training data preview - standalone (no torch needed)
Extracts only the data generation logic from train_workout_generator_v5.py
"""
import sys
import csv
import json
import random
from pathlib import Path
from collections import defaultdict

SCRIPT_DIR = Path(__file__).parent
DATA_FILE = SCRIPT_DIR / "data" / "exercises_final.json"

# Load exercises
with open(DATA_FILE, "r", encoding="utf-8") as f:
    exercises = json.load(f)

print(f"Loaded {len(exercises)} exercises")

# Constants
FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"]
FITNESS_GOALS = ["Strength", "Muscle", "WeightLoss", "Endurance", "General"]
BODY_FAT_CATEGORIES = {"lean": (5, 14), "normal": (
    15, 22), "higher": (23, 30), "obese": (31, 45)}
MUSCLE_MASS_CATEGORIES = {
    "low": (18, 28), "average": (28, 38), "high": (38, 55)}
BODY_PARTS_INJURY = ["shoulder", "lower_back", "upper_back",
                     "knee", "ankle", "wrist", "elbow", "neck", "hip"]
INJURY_TYPES = ["strain", "sprain", "soreness",
                "pain", "stiffness", "inflammation"]
SEVERITY_MAP = {(1, 3): "mild", (4, 6): "moderate",
                (7, 9): "severe", (10, 10): "critical"}
DIFFICULTY_PREFS = ["easier", "normal", "harder", "much harder"]
COMPOUND_PATTERNS = {"horizontal_push", "horizontal_pull",
                     "vertical_push", "vertical_pull", "squat", "hip_hinge", "lunge"}
ISOLATION_PATTERNS = {"elbow_flexion", "elbow_extension",
                      "shoulder_raise", "core_flexion", "calf", "knee_flexion"}

PLAN_PROMPTS = [
    "Generate a {days}-day {goal} workout plan",
    "Create a {days}-day {goal} program",
    "Build a {days} day {goal} routine",
    "Design a {days}-day {goal} training split",
    "Plan a {days} day {goal} workout routine",
]

SPLIT_TEMPLATES = {
    3: [
        {"name": "Push/Pull/Legs", "days": [
            {"name": "Push", "patterns": ["horizontal_push", "vertical_push", "elbow_extension",
                                          "shoulder_raise"], "muscles": ["chest", "shoulders", "triceps"]},
            {"name": "Pull", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"], "muscles": [
                "lats", "middle back", "biceps"]},
            {"name": "Legs", "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"], "muscles": [
                "quadriceps", "hamstrings", "glutes", "calves"]},
        ]},
        {"name": "Full Body x3", "days": [
            {"name": "Full Body A", "patterns": ["horizontal_push", "vertical_pull", "squat", "core_flexion"], "muscles": [
                "chest", "lats", "quadriceps", "abdominals"]},
            {"name": "Full Body B", "patterns": ["vertical_push", "horizontal_pull", "hip_hinge", "elbow_flexion"], "muscles": [
                "shoulders", "middle back", "hamstrings", "biceps"]},
            {"name": "Full Body C", "patterns": ["horizontal_push", "horizontal_pull", "lunge", "elbow_extension"], "muscles": [
                "chest", "lats", "glutes", "triceps"]},
        ]},
    ],
    4: [
        {"name": "Upper/Lower", "days": [
            {"name": "Upper A", "patterns": ["horizontal_push", "horizontal_pull", "elbow_extension", "elbow_flexion"], "muscles": [
                "chest", "lats", "triceps", "biceps"]},
            {"name": "Lower A", "patterns": ["squat", "hip_hinge", "calf", "core_flexion"], "muscles": [
                "quadriceps", "hamstrings", "calves", "abdominals"]},
            {"name": "Upper B", "patterns": ["vertical_push", "vertical_pull", "shoulder_raise", "elbow_flexion"], "muscles": [
                "shoulders", "middle back", "biceps"]},
            {"name": "Lower B", "patterns": ["hip_hinge", "lunge", "squat", "calf"], "muscles": [
                "hamstrings", "glutes", "quadriceps", "calves"]},
        ]},
        {"name": "PPLA", "days": [
            {"name": "Push", "patterns": ["horizontal_push", "vertical_push", "elbow_extension"], "muscles": [
                "chest", "shoulders", "triceps"]},
            {"name": "Pull", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"], "muscles": [
                "lats", "middle back", "biceps"]},
            {"name": "Legs", "patterns": ["squat", "hip_hinge", "lunge", "calf"], "muscles": [
                "quadriceps", "hamstrings", "glutes", "calves"]},
            {"name": "Arms + Abs", "patterns": ["elbow_flexion", "elbow_extension", "shoulder_raise",
                                                "core_flexion"], "muscles": ["biceps", "triceps", "shoulders", "abdominals"]},
        ]},
    ],
    5: [
        {"name": "Bro Split", "days": [
            {"name": "Chest", "patterns": [
                "horizontal_push", "elbow_extension"], "muscles": ["chest", "triceps"]},
            {"name": "Back", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"], "muscles": [
                "lats", "middle back", "biceps"]},
            {"name": "Shoulders", "patterns": [
                "vertical_push", "shoulder_raise", "core_flexion"], "muscles": ["shoulders", "abdominals"]},
            {"name": "Legs", "patterns": ["squat", "hip_hinge", "lunge", "calf"], "muscles": [
                "quadriceps", "hamstrings", "glutes", "calves"]},
            {"name": "Arms", "patterns": ["elbow_flexion", "elbow_extension", "shoulder_raise"], "muscles": [
                "biceps", "triceps", "forearms"]},
        ]},
        {"name": "ULPPL", "days": [
            {"name": "Upper", "patterns": ["horizontal_push", "horizontal_pull", "elbow_extension", "elbow_flexion"], "muscles": [
                "chest", "lats", "triceps", "biceps"]},
            {"name": "Lower", "patterns": ["squat", "hip_hinge", "lunge", "calf"], "muscles": [
                "quadriceps", "hamstrings", "glutes", "calves"]},
            {"name": "Push", "patterns": ["horizontal_push", "vertical_push", "elbow_extension",
                                          "shoulder_raise"], "muscles": ["chest", "shoulders", "triceps"]},
            {"name": "Pull", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"], "muscles": [
                "lats", "middle back", "biceps"]},
            {"name": "Legs", "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"], "muscles": [
                "quadriceps", "hamstrings", "glutes", "calves", "abdominals"]},
        ]},
    ],
    6: [
        {"name": "PPL x2", "days": [
            {"name": "Push A", "patterns": ["horizontal_push", "vertical_push", "elbow_extension", "shoulder_raise"], "muscles": [
                "chest", "shoulders", "triceps"]},
            {"name": "Pull A", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"], "muscles": [
                "lats", "middle back", "biceps"]},
            {"name": "Legs A", "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"], "muscles": [
                "quadriceps", "hamstrings", "glutes", "calves"]},
            {"name": "Push B", "patterns": ["horizontal_push", "vertical_push", "elbow_extension", "shoulder_raise"], "muscles": [
                "chest", "shoulders", "triceps"]},
            {"name": "Pull B", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"], "muscles": [
                "middle back", "lats", "biceps"]},
            {"name": "Legs B", "patterns": ["hip_hinge", "lunge", "knee_flexion", "calf"], "muscles": [
                "hamstrings", "glutes", "calves"]},
        ]},
    ],
}

INJURY_RULES = {
    "shoulder": {
        "avoid_patterns_moderate": {"vertical_push", "shoulder_raise"},
        "avoid_patterns_severe": {"vertical_push", "shoulder_raise", "horizontal_push"},
        "related_muscles": {"shoulders"},
        "mild_note": "use lighter weight on overhead movements",
        "moderate_note": "avoid overhead pressing, use machines",
        "severe_note": "skip all shoulder-dominant exercises",
    },
    "lower_back": {
        "avoid_patterns_moderate": {"hip_hinge"},
        "avoid_patterns_severe": {"hip_hinge", "squat", "lunge"},
        "related_muscles": {"lower back", "glutes", "hamstrings"},
        "mild_note": "brace core tight, avoid rounding",
        "moderate_note": "replace free weight hinges with machines",
        "severe_note": "skip deadlifts, squats and bent rows entirely",
    },
    "knee": {
        "avoid_patterns_moderate": {"squat", "lunge"},
        "avoid_patterns_severe": {"squat", "lunge", "knee_extension", "knee_flexion", "calf"},
        "related_muscles": {"quadriceps", "hamstrings", "calves"},
        "mild_note": "limit depth on squats, avoid jumping",
        "moderate_note": "use leg press or machines instead of squats",
        "severe_note": "skip all knee-flexion and leg exercises",
    },
    "wrist": {
        "avoid_patterns_moderate": {"horizontal_push"},
        "avoid_patterns_severe": {"horizontal_push", "horizontal_pull", "elbow_flexion"},
        "related_muscles": {"forearms"},
        "mild_note": "use wrist wraps, neutral grip preferred",
        "moderate_note": "use machines or cables instead of free weights",
        "severe_note": "skip gripping exercises, use machines only",
    },
    "elbow": {
        "avoid_patterns_moderate": {"elbow_flexion", "elbow_extension"},
        "avoid_patterns_severe": {"elbow_flexion", "elbow_extension", "horizontal_push", "horizontal_pull"},
        "related_muscles": {"biceps", "triceps", "forearms"},
        "mild_note": "reduce isolation arm volume",
        "moderate_note": "skip direct arm work, compounds only",
        "severe_note": "avoid all elbow-stressing movements",
    },
    "hip": {
        "avoid_patterns_moderate": {"squat", "hip_hinge", "lunge"},
        "avoid_patterns_severe": {"squat", "hip_hinge", "lunge", "knee_extension", "knee_flexion"},
        "related_muscles": {"glutes", "hamstrings", "quadriceps"},
        "mild_note": "limit hip flexion range",
        "moderate_note": "use machines, avoid deep squats",
        "severe_note": "skip all hip-dominant exercises",
    },
    "ankle": {
        "avoid_patterns_moderate": {"squat", "calf", "lunge"},
        "avoid_patterns_severe": {"squat", "calf", "lunge", "hip_hinge"},
        "related_muscles": {"calves"},
        "mild_note": "use heel elevation for squats",
        "moderate_note": "seated exercises preferred",
        "severe_note": "skip standing lower body exercises",
    },
    "neck": {
        "avoid_patterns_moderate": set(),
        "avoid_patterns_severe": {"vertical_push"},
        "related_muscles": {"neck", "traps"},
        "mild_note": "avoid neck strain positions",
        "moderate_note": "skip overhead pressing",
        "severe_note": "skip all exercises with neck load",
    },
    "upper_back": {
        "avoid_patterns_moderate": {"horizontal_pull"},
        "avoid_patterns_severe": {"horizontal_pull", "vertical_pull"},
        "related_muscles": {"middle back", "lats", "traps"},
        "mild_note": "limit rowing volume",
        "moderate_note": "use machines for back work",
        "severe_note": "skip heavy pulling movements",
    },
}

# Organize exercises
by_pattern = defaultdict(list)
by_muscle = defaultdict(list)
equipment_set = set()
for ex in exercises:
    by_pattern[ex.get("movement_pattern", "other")].append(ex)
    for m in ex.get("primaryMuscles", []):
        by_muscle[m].append(ex)
    equipment_set.add(ex.get("equipment", "body only"))


def severity_label(sev):
    for (lo, hi), label in SEVERITY_MAP.items():
        if lo <= sev <= hi:
            return label
    return "unknown"


def random_user_context():
    level = random.choice(FITNESS_LEVELS)
    goal = random.choice(FITNESS_GOALS)
    days = random.choice([3, 4, 5, 6])
    inbody = None
    if random.random() < 0.6:
        bf_cat = random.choice(list(BODY_FAT_CATEGORIES.keys()))
        mm_cat = random.choice(list(MUSCLE_MASS_CATEGORIES.keys()))
        inbody = {"bf_pct": round(random.uniform(*BODY_FAT_CATEGORIES[bf_cat]), 1), "bf_cat": bf_cat, "mm_kg": round(
            random.uniform(*MUSCLE_MASS_CATEGORIES[mm_cat]), 1), "mm_cat": mm_cat}
    injuries = []
    if random.random() < 0.4:
        for part in random.sample(BODY_PARTS_INJURY, random.randint(1, 2)):
            sev = random.randint(1, 9)
            injuries.append({"part": part, "severity": sev, "type": random.choice(
                INJURY_TYPES), "label": severity_label(sev)})
    feedback = None
    if random.random() < 0.4:
        feedback = {"difficulty": random.choice(DIFFICULTY_PREFS), "rating": round(
            random.uniform(3.0, 5.0), 1), "sessions": random.randint(5, 60)}
    equip_list = sorted(equipment_set)
    n_equip = random.randint(4, min(10, len(equip_list)))
    equipment = random.sample(equip_list, n_equip)
    if "body only" not in equipment:
        equipment.append("body only")
    return {"level": level, "goal": goal, "days": days, "equipment": equipment, "inbody": inbody, "injuries": injuries, "feedback": feedback}


def build_user_message(ctx):
    tmpl = random.choice(PLAN_PROMPTS)
    prompt = tmpl.format(days=ctx["days"], goal=ctx["goal"].lower())
    parts = [f"Level: {ctx['level']}",
             f"Goal: {ctx['goal']}", f"Days: {ctx['days']}"]
    if ctx.get("inbody"):
        ib = ctx["inbody"]
        parts.append(f"Body fat: {ib['bf_pct']}% ({ib['bf_cat']})")
        parts.append(f"Muscle mass: {ib['mm_kg']}kg ({ib['mm_cat']})")
    if ctx.get("injuries"):
        inj_strs = [
            f"{i['part']}({i['label']},{i['severity']}/10)" for i in ctx["injuries"]]
        parts.append(f"Injuries: {','.join(inj_strs)}")
    if ctx.get("feedback"):
        fb = ctx["feedback"]
        parts.append(
            f"Feedback: {fb['difficulty']} difficulty, rating {fb['rating']}, {fb['sessions']} sessions done")
    if ctx.get("equipment"):
        parts.append(f"Equipment: {','.join(ctx['equipment'][:8])}")
    return f"{prompt}\n[Context] {' | '.join(parts)}"


def get_exercises_for_day(day_tmpl, ctx, n=6):
    exs = []
    used = set()
    injuries = ctx.get("injuries", [])
    goal = ctx["goal"]
    level = ctx["level"]
    equipment = [e.lower() for e in ctx.get("equipment", [])]
    avoid_pats = set()
    for inj in injuries:
        rules = INJURY_RULES.get(inj["part"], {})
        if inj["severity"] >= 7:
            avoid_pats.update(rules.get("avoid_patterns_severe", set()))
        elif inj["severity"] >= 4:
            avoid_pats.update(rules.get("avoid_patterns_moderate", set()))
    day_patterns = day_tmpl["patterns"]
    compound_pats = [p for p in day_patterns if p in COMPOUND_PATTERNS]
    isolation_pats = [p for p in day_patterns if p in ISOLATION_PATTERNS]
    other_pats = [
        p for p in day_patterns if p not in COMPOUND_PATTERNS and p not in ISOLATION_PATTERNS]
    for pattern_group in [compound_pats, isolation_pats, other_pats]:
        for pat in pattern_group:
            if pat in avoid_pats:
                continue
            if len(exs) >= n:
                break
            candidates = by_pattern.get(pat, [])
            if equipment:
                filtered = [ex for ex in candidates if ex.get(
                    "equipment", "body only").lower() in equipment]
                if filtered:
                    candidates = filtered
            if level == "Beginner":
                filtered = [ex for ex in candidates if ex.get(
                    "difficulty_level", 3) <= 3]
                if filtered:
                    candidates = filtered
            if not candidates:
                continue

            def score(ex):
                s = ex.get("goal_suitability", {}).get(goal, 5)
                if goal == "Strength" and ex.get("mechanic") == "compound":
                    s += 2
                s += random.uniform(-1, 1)
                return s
            candidates.sort(key=score, reverse=True)
            picks = 2 if pat in COMPOUND_PATTERNS else 1
            for ex in candidates:
                if ex["name"] not in used and len(exs) < n:
                    exs.append(ex)
                    used.add(ex["name"])
                    picks -= 1
                    if picks <= 0:
                        break
    if len(exs) < n:
        for muscle in day_tmpl.get("muscles", []):
            if len(exs) >= n:
                break
            cands = [
                ex for ex in by_muscle.get(muscle, [])
                if ex["name"] not in used
                and ex.get("movement_pattern", "other") not in avoid_pats
            ]
            if equipment:
                filtered = [ex for ex in cands if ex.get(
                    "equipment", "body only").lower() in equipment]
                if filtered:
                    cands = filtered
            if cands:
                random.shuffle(cands)
                exs.append(cands[0])
                used.add(cands[0]["name"])
    return exs


def format_compact_plan(ctx, split, day_exercises):
    lines = []
    goal = ctx["goal"]
    level = ctx["level"]
    days = ctx["days"]
    weeks = random.choice([4, 6, 8, 10, 12])
    lines.append(f"PLAN:{days}d {split['name']}|{goal}|{level}|{weeks}w")
    if ctx.get("injuries"):
        inj_parts = []
        for inj in ctx["injuries"]:
            rules = INJURY_RULES.get(inj["part"], {})
            note_key = f"{inj['label']}_note"
            note = rules.get(note_key, "monitor carefully")
            inj_parts.append(
                f"{inj['part']}({inj['label']},{inj['severity']}/10):{note}")
        lines.append(f"INJ:{';'.join(inj_parts)}")
    if ctx.get("feedback"):
        fb = ctx["feedback"]
        lines.append(
            f"FB:{fb['difficulty']} pref,rating {fb['rating']},{fb['sessions']} sessions")
    lines.append("---")
    goal_reps = {"Strength": (3, 6, 180), "Muscle": (8, 12, 90), "WeightLoss": (
        12, 20, 45), "Endurance": (15, 25, 30), "General": (8, 15, 60)}
    min_r, max_r, rest = goal_reps.get(goal, (8, 12, 60))
    goal_sets = {"Strength": 4, "Muscle": 3,
                 "WeightLoss": 3, "Endurance": 3, "General": 3}
    base_sets = goal_sets.get(goal, 3)
    if level == "Advanced":
        base_sets += 1
    elif level == "Beginner":
        base_sets = max(2, base_sets - 1)
    for day_idx, (day_tmpl, day_exs) in enumerate(zip(split["days"], day_exercises)):
        duration = random.randint(40, 70)
        muscles = ",".join(day_tmpl["muscles"][:4])
        lines.append(
            f"D{day_idx+1}:{day_tmpl['name']}[{muscles}]{duration}min")
        for ex_idx, ex in enumerate(day_exs):
            mech = ex.get("mechanic", "compound")
            rr = ex.get("rep_ranges_by_goal", {}).get(goal, {})
            sets = rr.get("sets", base_sets)
            reps_min = rr.get("min_reps", min_r)
            reps_max = rr.get("max_reps", max_r)
            ex_rest = rr.get("rest_seconds", rest)
            type_char = "C" if mech == "compound" else "I"
            rpe = random.randint(
                6 if level == "Beginner" else 7, 8 if level == "Beginner" else 10)
            equip = ex.get("equipment", "body only")
            # Injury marker â€” only mark exercises targeting injured area muscles
            marker = ""
            if ctx.get("injuries"):
                ex_muscles = set(ex.get("primaryMuscles", []))
                for inj in ctx["injuries"]:
                    rules = INJURY_RULES.get(inj["part"], {})
                    related = rules.get("related_muscles", set())
                    if ex_muscles & related:
                        if inj["severity"] >= 7:
                            marker = "|*MODIFIED"
                        elif inj["severity"] >= 4:
                            marker = "|*LIGHT"
                        elif inj["severity"] >= 1:
                            marker = "|*MONITOR"
            lines.append(
                f"{ex_idx+1}.{ex['name']}|{sets}x{reps_min}-{reps_max}|{ex_rest}s|{type_char}|RPE{rpe}|{equip}{marker}")
        lines.append("---")
    prog_options = ["Add 2.5-5% weight when hitting top reps", "Increase reps before adding weight",
                    "Double progression: reps then weight", "Add 1 rep per set each week", "Linear periodization: reduce reps weekly"]
    deload_options = [f"Week {weeks}: reduce volume 40%, keep intensity",
                      f"Every {weeks//2} weeks: half volume", f"Week {weeks}: active recovery only"]
    lines.append(f"PROG:{random.choice(prog_options)}")
    lines.append(f"DELOAD:{random.choice(deload_options)}")
    return "\n".join(lines)


def generate_example():
    ctx = random_user_context()
    splits = SPLIT_TEMPLATES.get(ctx["days"], SPLIT_TEMPLATES[3])
    split = random.choice(splits)
    day_exercises = [get_exercises_for_day(d, ctx) for d in split["days"]]
    user_msg = build_user_message(ctx)
    assistant_msg = format_compact_plan(ctx, split, day_exercises)
    return {"user": user_msg, "assistant": assistant_msg}


def generate_injury_example():
    ctx = random_user_context()
    if not ctx["injuries"]:
        part = random.choice(BODY_PARTS_INJURY)
        sev = random.randint(3, 9)
        ctx["injuries"] = [{"part": part, "severity": sev, "type": random.choice(
            INJURY_TYPES), "label": severity_label(sev)}]
    inj = ctx["injuries"][0]
    injury_prompts = [
        f"Modify workout - {inj['part']} is injured",
        f"I have a {inj['part']} injury, create safe plan",
        f"Need workout plan with {inj['part']} {inj['type']}",
        f"Adjust training for {inj['part']} issue",
    ]
    splits = SPLIT_TEMPLATES.get(ctx["days"], SPLIT_TEMPLATES[3])
    split = random.choice(splits)
    day_exercises = [get_exercises_for_day(d, ctx) for d in split["days"]]
    parts = [f"Level: {ctx['level']}",
             f"Goal: {ctx['goal']}", f"Days: {ctx['days']}"]
    parts.append(f"Injury: {inj['part']}({inj['label']},{inj['severity']}/10)")
    if ctx.get("inbody"):
        ib = ctx["inbody"]
        parts.append(f"Body fat: {ib['bf_pct']}%({ib['bf_cat']})")
    if ctx.get("equipment"):
        parts.append(f"Equipment: {','.join(ctx['equipment'][:6])}")
    user_msg = f"{random.choice(injury_prompts)}\n[Context] {' | '.join(parts)}"
    assistant_msg = format_compact_plan(ctx, split, day_exercises)
    return {"user": user_msg, "assistant": assistant_msg}


# ============================================================
# GENERATE TRAINING DATA PREVIEW -> CSV + JSONL
# ============================================================

NUM_SAMPLES = int(sys.argv[1]) if len(sys.argv) > 1 else 200
REGULAR_PCT = 0.80

random.seed(42)
samples = []
n_regular = int(NUM_SAMPLES * REGULAR_PCT)
n_injury = NUM_SAMPLES - n_regular

print(
    f"Generating {n_regular} regular + {n_injury} injury examples ({NUM_SAMPLES} total)...")

for i in range(n_regular):
    samples.append(("regular", generate_example()))
for i in range(n_injury):
    samples.append(("injury", generate_injury_example()))

random.shuffle(samples)

# ---- CSV output ----
out_csv = SCRIPT_DIR / "training_data_preview.csv"
with open(out_csv, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["sample_id", "type", "user_message", "model_output"])
    for i, (typ, s) in enumerate(samples, 1):
        writer.writerow([i, typ, s["user"], s["assistant"]])

# ---- JSONL output ----
out_jsonl = SCRIPT_DIR / "training_data_preview.jsonl"
with open(out_jsonl, "w", encoding="utf-8") as f:
    for i, (typ, s) in enumerate(samples, 1):
        obj = {"id": i, "type": typ,
               "user": s["user"], "assistant": s["assistant"]}
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

# ---- Stats ----
goals = {}
levels = {}
day_counts = {}
inj_count = 0
fb_count = 0
ib_count = 0
for _, s in samples:
    user = s["user"]
    if "Injuries:" in user or "Injury:" in user:
        inj_count += 1
    if "Feedback:" in user:
        fb_count += 1
    if "Body fat:" in user:
        ib_count += 1
    for g in ["Strength", "Muscle", "WeightLoss", "Endurance", "General"]:
        if f"Goal: {g}" in user:
            goals[g] = goals.get(g, 0) + 1
    for l in ["Beginner", "Intermediate", "Advanced"]:
        if f"Level: {l}" in user:
            levels[l] = levels.get(l, 0) + 1
    for d in ["3", "4", "5", "6"]:
        if f"Days: {d}" in user:
            day_counts[d] = day_counts.get(d, 0) + 1

print(f"\nGenerated {len(samples)} samples")
print(f"  CSV:   {out_csv}")
print(f"  JSONL: {out_jsonl}")
print(f"\nDistribution:")
print(f"  Goals:   {goals}")
print(f"  Levels:  {levels}")
print(f"  Days:    {day_counts}")
print(
    f"  Injuries: {inj_count}/{len(samples)} ({100*inj_count/len(samples):.0f}%)")
print(
    f"  Feedback: {fb_count}/{len(samples)} ({100*fb_count/len(samples):.0f}%)")
print(
    f"  InBody:   {ib_count}/{len(samples)} ({100*ib_count/len(samples):.0f}%)")
print("\nOpen the CSV or JSONL to review!")
