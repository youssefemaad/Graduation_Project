"""
Build Clean Exercise Database v2
Merges free-exercise-db + strength.json unique exercises.
Filters out stretches/cardio/foam-roll, fixes equipment from name suffix,
fixes mechanic (compound/isolation) via name-pattern overrides,
and assigns correct movement patterns + goal-specific rep ranges.
"""
import json
import re
from pathlib import Path
from collections import defaultdict

SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / "data" / "exercises_clean_merged.json"

# Standardized 17 muscle names
VALID_MUSCLES = {
    "abdominals", "abductors", "adductors", "biceps", "calves",
    "chest", "forearms", "glutes", "hamstrings", "lats",
    "lower back", "middle back", "neck", "quadriceps",
    "shoulders", "traps", "triceps"
}

# Map alternate muscle names to standardized names
MUSCLE_ALIASES = {
    "abdominal": "abdominals",
    "abs": "abdominals",
    "oblique": "abdominals",
    "obliques": "abdominals",
    "bicep": "biceps",
    "calf": "calves",
    "forearm": "forearms",
    "forearm - inner": "forearms",
    "forearm - outer": "forearms",
    "glute": "glutes",
    "gluteus maximus": "glutes",
    "gluteus medius": "glutes",
    "hamstring": "hamstrings",
    "lat": "lats",
    "latissimus dorsi": "lats",
    "quad": "quadriceps",
    "quads": "quadriceps",
    "shoulder": "shoulders",
    "shoulder - front": "shoulders",
    "shoulder - back": "shoulders",
    "shoulder - side": "shoulders",
    "deltoid": "shoulders",
    "anterior deltoid": "shoulders",
    "posterior deltoid": "shoulders",
    "lateral deltoid": "shoulders",
    "rotator cuff": "shoulders",
    "rotator cuff - front": "shoulders",
    "rotator cuff - back": "shoulders",
    "trap": "traps",
    "trapezius": "traps",
    "tricep": "triceps",
    "pectoral": "chest",
    "pectorals": "chest",
    "thigh - inner": "adductors",
    "inner thigh": "adductors",
    "thigh - outer": "abductors",
    "outer thigh": "abductors",
    "hip flexor": "quadriceps",
    "hip flexors": "quadriceps",
    "erector spinae": "lower back",
    "rhomboids": "middle back",
    "serratus anterior": "chest",
}


def standardize_muscle(name: str) -> str:
    """Map any muscle name to standardized version"""
    n = name.lower().strip()
    if n in VALID_MUSCLES:
        return n
    return MUSCLE_ALIASES.get(n, None)


# ────────────────────────────────────────────────────
# Equipment inference from exercise name suffix
# ────────────────────────────────────────────────────
EQUIPMENT_NAME_HINTS = [
    # (pattern in name, correct equipment) — ORDER MATTERS, most specific first
    ("e-z curl bar", "e-z curl bar"),
    ("ez-bar", "e-z curl bar"),
    ("ez bar", "e-z curl bar"),
    ("barbell", "barbell"),
    ("dumbbell", "dumbbell"),
    ("kettlebell", "kettlebells"),
    ("cable", "cable"),
    ("machine", "machine"),
    ("band", "bands"),
    ("smith", "machine"),
    ("medicine ball", "medicine ball"),
    ("exercise ball", "exercise ball"),
    ("stability ball", "exercise ball"),
    ("foam roll", "foam roll"),
    ("trx", "other"),
    ("landmine", "barbell"),
    # Common exercise types that imply equipment
    ("pulldown", "cable"),
    ("pull-down", "cable"),
    ("lat pull", "cable"),
    ("crossover", "cable"),
    ("pec deck", "machine"),
    ("leg press", "machine"),
    ("hack squat", "machine"),
    ("preacher", "e-z curl bar"),
    ("pendlay", "barbell"),
    ("t-bar", "barbell"),
    ("snatch", "barbell"),
    ("clean and", "barbell"),
    ("bench press", "barbell"),
    ("arnold press", "dumbbell"),
    ("rack pull", "barbell"),
    ("front squat", "barbell"),
    ("skull crush", "barbell"),
    ("good morning", "barbell"),
    ("overhead press", "barbell"),
]


def infer_equipment(name: str, current_equip: str) -> str:
    """Fix equipment label by checking the exercise name for hints.
    Only override if current_equip is 'body only' or empty."""
    if current_equip and current_equip not in ("body only", "other", ""):
        return current_equip
    nl = name.lower()
    for hint, equip in EQUIPMENT_NAME_HINTS:
        if hint in nl:
            return equip
    return current_equip or "body only"


# ────────────────────────────────────────────────────
# Mechanic override: name-pattern → isolation / compound
# ────────────────────────────────────────────────────
ISOLATION_PATTERNS = [
    r"\bcurls?\b", r"\braises?\b", r"\bflys?\b", r"\bflyes?\b", r"\bflies\b",
    r"\bkickbacks?\b", r"\bpushdowns?\b", r"\bpullovers?\b",
    r"\bshrugs?\b", r"\bwrist\b", r"\bforearm\b",
    r"\bcalf raise\b", r"\bcalf press\b",
    r"\bleg extension\b", r"\bquad extension\b",
    r"\bleg curl\b", r"\bhamstring curl\b",
    r"\bface pull\b", r"\brear delt\b",
    r"\blateral\b.*\braise\b", r"\bfront\b.*\braise\b",
    r"\bcable crossover\b", r"\bpec deck\b", r"\bpec fly\b",
    r"\bconcentration\b", r"\bpreacher\b",
    r"\bhip adduction\b", r"\bhip abduction\b",
    r"\binternal rotation\b", r"\bexternal rotation\b",
    r"\bneck\b.*\bflexion\b", r"\bneck\b.*\bextension\b",
    r"\bisometric\b", r"\bsqueeze\b",
    r"\bextension\b(?!.*(?:press|push|squat))",
]
COMPOUND_PATTERNS = [
    r"\bpress\b", r"\bsquat\b", r"\bdeadlift\b",
    r"\brow\b", r"\bpull[- ]?up\b", r"\bchin[- ]?up\b",
    r"\bdip\b", r"\blunge\b", r"\bstep[- ]?up\b",
    r"\bclean\b", r"\bsnatch\b", r"\bjerk\b",
    r"\bthrust\b", r"\bpush[- ]?up\b",
    r"\bgood morning\b", r"\bhyperextension\b",
]


def fix_mechanic(name: str, current_mech: str) -> str:
    """Override mechanic if name clearly indicates isolation or compound."""
    nl = name.lower()
    # Check isolation first (more specific patterns)
    for pat in ISOLATION_PATTERNS:
        if re.search(pat, nl):
            return "isolation"
    for pat in COMPOUND_PATTERNS:
        if re.search(pat, nl):
            return "compound"
    return current_mech if current_mech in ("compound", "isolation") else "compound"


# ────────────────────────────────────────────────────
# Categories to KEEP (filter out stretching, cardio, foam roll)
# ────────────────────────────────────────────────────
VALID_CATEGORIES = {"strength", "powerlifting",
                    "olympic weightlifting", "strongman", "plyometrics"}

# Map movement patterns from force + mechanic + primaryMuscle
MOVEMENT_PATTERN_RULES = {
    # (force, mechanic, primary_muscle) -> pattern
    ("push", "compound", "chest"): "horizontal_push",
    ("push", "compound", "shoulders"): "vertical_push",
    ("push", "compound", "triceps"): "horizontal_push",
    ("push", "compound", "quadriceps"): "squat",
    ("push", "isolation", "triceps"): "elbow_extension",
    ("push", "isolation", "shoulders"): "shoulder_raise",
    ("push", "isolation", "quadriceps"): "knee_extension",
    ("push", "isolation", "chest"): "horizontal_push",
    ("push", "isolation", "calves"): "calf",
    ("pull", "compound", "lats"): "vertical_pull",
    ("pull", "compound", "middle back"): "horizontal_pull",
    ("pull", "compound", "lower back"): "hip_hinge",
    ("pull", "compound", "hamstrings"): "hip_hinge",
    ("pull", "compound", "glutes"): "hip_hinge",
    ("pull", "compound", "biceps"): "vertical_pull",
    ("pull", "compound", "traps"): "horizontal_pull",
    ("pull", "isolation", "biceps"): "elbow_flexion",
    ("pull", "isolation", "lats"): "vertical_pull",
    ("pull", "isolation", "middle back"): "horizontal_pull",
    ("pull", "isolation", "hamstrings"): "knee_flexion",
    ("pull", "isolation", "forearms"): "elbow_flexion",
    ("pull", "isolation", "abdominals"): "core_flexion",
    ("pull", "isolation", "glutes"): "hip_hinge",
    ("pull", "isolation", "lower back"): "hip_hinge",
    ("pull", "isolation", "traps"): "shoulder_raise",
    ("pull", "isolation", "adductors"): "other",
    ("pull", "isolation", "abductors"): "other",
    ("pull", "isolation", "neck"): "other",
    ("static", "compound", "abdominals"): "core_flexion",
    ("static", "isolation", "abdominals"): "core_flexion",
    ("static", "compound", "quadriceps"): "squat",
    ("static", "compound", "shoulders"): "vertical_push",
    ("static", "compound", "glutes"): "hip_hinge",
    ("static", "compound", "chest"): "horizontal_push",
}

# Keyword-based fallback pattern detection (ORDER MATTERS - specific before general)
PATTERN_KEYWORDS = {
    "knee_extension": ["leg extension", "quad extension", "knee extension", "terminal knee"],
    "knee_flexion": ["leg curl", "hamstring curl", "lying curl", "prone curl"],
    "calf": ["calf raise", "calf press", "donkey calf", "seated calf", "standing calf"],
    "squat": ["squat", "leg press", "hack squat", "goblet", "pistol", "box jump", "tire flip"],
    "lunge": ["lunge", "step-up", "step up", "split squat", "bulgarian"],
    "hip_hinge": [
        "deadlift", "romanian", "good morning", "hip thrust", "glute bridge",
        "hyperextension", "back extension", "pull through", "hip hinge",
        "hip lift", "hip extension", "hamstring bridge", "butt lift",
        "glute kickback", "hang clean", "power clean", "clean and jerk",
        "kettlebell swing", "rack pull",
    ],
    "horizontal_push": ["bench press", "push-up", "push up", "pushup", "dip",
                        "chest press", "floor press", "chest fly", "cable crossover", "pec",
                        "iron cross"],
    "vertical_push": ["overhead press", "military press", "shoulder press",
                      "arnold press", "pike push", "jerk", "push press", "bradford press",
                      "z press"],
    "horizontal_pull": ["row", "bent over", "cable row", "seated row", "t-bar",
                        "face pull", "inverted row"],
    "vertical_pull": ["pull-up", "pullup", "chin-up", "chinup", "lat pulldown",
                      "pulldown", "muscle up", "muscle-up"],
    "elbow_flexion": ["curl", "bicep", "biceps", "hammer curl", "preacher"],
    "elbow_extension": ["tricep extension", "triceps extension", "skull crusher",
                        "pushdown", "tricep kickback", "overhead extension", "skullcrusher"],
    "shoulder_raise": ["lateral raise", "front raise", "rear delt", "upright row",
                       "shrug", "reverse fly", "reverse flye", "rear fly", "rear flye"],
    "core_flexion": ["crunch", "sit-up", "situp", "plank", "ab wheel", "leg raise",
                     "hanging knee", "russian twist", "wood chop", "flutter kick",
                     "mountain climber", "v-up", "toe touch", "heel toucher", "cocoon"],
}

# Rep ranges by goal
REP_RANGES = {
    "Strength": {"min_reps": 3, "max_reps": 6, "rest_seconds": 180, "sets": 4},
    "Muscle": {"min_reps": 8, "max_reps": 12, "rest_seconds": 90, "sets": 3},
    "WeightLoss": {"min_reps": 12, "max_reps": 20, "rest_seconds": 45, "sets": 3},
    "Endurance": {"min_reps": 15, "max_reps": 25, "rest_seconds": 30, "sets": 3},
    "General": {"min_reps": 8, "max_reps": 15, "rest_seconds": 60, "sets": 3},
}

REP_RANGES_ISOLATION = {
    "Strength": {"min_reps": 6, "max_reps": 10, "rest_seconds": 120, "sets": 3},
    "Muscle": {"min_reps": 10, "max_reps": 15, "rest_seconds": 60, "sets": 3},
    "WeightLoss": {"min_reps": 15, "max_reps": 25, "rest_seconds": 30, "sets": 3},
    "Endurance": {"min_reps": 20, "max_reps": 30, "rest_seconds": 20, "sets": 2},
    "General": {"min_reps": 10, "max_reps": 15, "rest_seconds": 60, "sets": 3},
}

# Goal suitability scores (1-10) based on exercise type
GOAL_SUITABILITY = {
    "compound": {"Strength": 9, "Muscle": 8, "WeightLoss": 7, "Endurance": 6, "General": 8},
    "isolation": {"Strength": 5, "Muscle": 9, "WeightLoss": 7, "Endurance": 8, "General": 7},
}

# ════════════════════════════════════════════════════════════════════════
#  NEW FIELDS: fatigue_score, stimulus_score, contraindications,
#              axial_load, skill_level, recovery_time_hours
#  Based on RP Strength Stimulus-to-Fatigue ratio research, NSCA
#  guidelines, and exercise science consensus.
# ════════════════════════════════════════════════════════════════════════

# ── Fatigue score (1-10) by movement pattern ──
# High: Deadlifts/Squats (heavy axial + systemic fatigue)
# Low:  Cable curls, lateral raises (minimal systemic fatigue)
BASE_FATIGUE_BY_PATTERN = {
    "hip_hinge": 8,       # Deadlifts, RDLs — very high systemic fatigue
    "squat": 7,           # Squats, leg press — high systemic fatigue
    "lunge": 6,           # Lunges, step-ups — moderate-high
    "horizontal_push": 5,  # Bench press — moderate
    "vertical_push": 5,   # OHP — moderate, shoulder-stressing
    "horizontal_pull": 5,  # Rows — moderate, lower-back stress
    "vertical_pull": 4,   # Pulldowns, pullups — moderate
    "elbow_flexion": 2,   # Curls — very low systemic fatigue
    "elbow_extension": 2,  # Tricep extensions — very low
    "shoulder_raise": 2,  # Lateral raises — very low
    "knee_extension": 3,  # Leg extensions — low-moderate
    "knee_flexion": 3,    # Leg curls — low-moderate
    "calf": 2,            # Calf raises — low
    "core_flexion": 2,    # Crunches, planks — low
    "other": 3,
}

# Fatigue modifiers by equipment (additive)
FATIGUE_EQUIP_MODIFIER = {
    "barbell": +2,       # Free-weight stabilization adds fatigue
    "dumbbell": +1,      # Moderate stabilization requirement
    "kettlebells": +1,
    "cable": -1,         # Guided resistance = less systemic fatigue
    "machine": -2,       # Fully guided = minimal systemic fatigue
    "bands": -1,
    "body only": 0,
    "e-z curl bar": +1,
    "exercise ball": 0,
    "medicine ball": 0,
    "foam roll": -2,
    "other": 0,
}

# ── Stimulus score (1-10) by movement pattern ──
# How effectively an exercise stimulates the target muscle for growth
BASE_STIMULUS_BY_PATTERN = {
    "hip_hinge": 9,       # Deadlifts — massive posterior chain stimulus
    "squat": 9,           # Squats — huge quad/glute stimulus
    "lunge": 7,           # Lunges — good unilateral stimulus
    "horizontal_push": 8,  # Bench press — strong chest stimulus
    "vertical_push": 7,   # OHP — good shoulder stimulus
    "horizontal_pull": 8,  # Rows — strong back stimulus
    "vertical_pull": 8,   # Pullups/pulldowns — great lat stimulus
    "elbow_flexion": 6,   # Curls — direct bicep stimulus
    "elbow_extension": 6,  # Extensions — direct tricep stimulus
    "shoulder_raise": 6,  # Lateral raises — good delt isolation
    "knee_extension": 6,  # Leg extensions — direct quad stimulus
    "knee_flexion": 6,    # Leg curls — direct hamstring stimulus
    "calf": 5,            # Calf raises — decent calf stimulus
    "core_flexion": 5,    # Crunches — moderate ab stimulus
    "other": 5,
}

# ── Axial load score (0-10) by movement pattern & exercise ──
# How much load goes through the spine. Squats/deadlifts = high, machines = low
BASE_AXIAL_LOAD_BY_PATTERN = {
    "hip_hinge": 9,       # Deadlifts — extreme spinal loading
    "squat": 8,           # Back squats — very high spinal loading
    "lunge": 5,           # Lunges — moderate (less load than squat)
    "horizontal_push": 2,  # Bench — supine, low axial load
    "vertical_push": 6,   # OHP — standing overhead = moderate-high axial
    "horizontal_pull": 5,  # Rows — bent over = moderate-high
    "vertical_pull": 1,   # Pulldowns — hanging/seated = very low
    "elbow_flexion": 0,   # Curls — no axial load
    "elbow_extension": 0,  # Extensions — no axial load
    "shoulder_raise": 1,  # Standing raises — minimal
    "knee_extension": 0,  # Seated — no axial load
    "knee_flexion": 0,    # Seated/lying — no axial load
    "calf": 3,            # Standing calf raise has some axial load
    "core_flexion": 1,    # Crunches — minimal
    "other": 2,
}

# Equipment modifier for axial load
AXIAL_EQUIP_MODIFIER = {
    "machine": -3,       # Machines remove spinal stabilization need
    "cable": -1,
    "barbell": +1,       # Barbell free-weight = more stabilization
    "dumbbell": 0,
    "body only": 0,
    "kettlebells": 0,
    "e-z curl bar": 0,
    "bands": -1,
    "exercise ball": 0,
    "medicine ball": 0,
    "foam roll": -2,
    "other": 0,
}

# ── Recovery time (hours) by movement pattern and mechanic ──
# Based on RP Strength data: compounds 48-72h, isolation 24-48h
RECOVERY_HOURS_BY_PATTERN = {
    "hip_hinge": 72,      # Deadlifts — longest recovery
    "squat": 72,          # Squats — very demanding
    "lunge": 48,          # Lunges — moderate compound
    "horizontal_push": 48,  # Bench press
    "vertical_push": 48,  # OHP
    "horizontal_pull": 48,  # Rows
    "vertical_pull": 48,  # Pullups
    "elbow_flexion": 24,  # Curls — fast recovery
    "elbow_extension": 24,  # Extensions — fast recovery
    "shoulder_raise": 24,  # Raises — fast recovery
    "knee_extension": 36,  # Leg extensions — moderate
    "knee_flexion": 36,    # Leg curls — moderate
    "calf": 24,            # Calves — fast recovery
    "core_flexion": 24,    # Abs — fast recovery
    "other": 36,
}

# ── Skill level by exercise name keywords ──
# Maps specific exercises to skill levels beyond simple difficulty
ADVANCED_EXERCISE_KEYWORDS = [
    "snatch", "clean and jerk", "power clean", "hang clean",
    "muscle up", "muscle-up", "pistol squat", "pistol",
    "front squat", "zercher", "deficit deadlift", "sumo deadlift",
    "dragon flag", "l-sit", "handstand", "planche",
    "atlas stone", "tire flip", "log press",
    "turkish get", "windmill", "bottoms up",
]
BEGINNER_EXERCISE_KEYWORDS = [
    "machine", "cable curl", "lat pulldown", "pulldown",
    "leg press", "leg extension", "leg curl",
    "pec deck", "chest fly - machine", "seated row",
    "assisted", "smith machine",
    "band", "wall sit",
]

# ── Contraindications mapping ──
# Maps exercise characteristics to injury conditions where they're risky
# More granular than pattern-level injury rules (exercise-specific)
CONTRAINDICATION_RULES = {
    # Pattern-based contraindications
    "hip_hinge": ["lower_back_injury", "disc_herniation", "sciatica"],
    "squat": ["knee_injury", "lower_back_injury", "hip_impingement"],
    "lunge": ["knee_injury", "ankle_injury", "hip_impingement"],
    "horizontal_push": ["shoulder_impingement", "rotator_cuff_tear", "pec_tear"],
    "vertical_push": ["shoulder_impingement", "rotator_cuff_tear", "neck_injury"],
    "horizontal_pull": ["lower_back_injury", "bicep_tendinitis"],
    "vertical_pull": ["shoulder_impingement", "rotator_cuff_tear"],
    "elbow_flexion": ["bicep_tendinitis", "elbow_tendinitis", "golfers_elbow"],
    "elbow_extension": ["elbow_tendinitis", "tennis_elbow", "tricep_tendinitis"],
    "shoulder_raise": ["shoulder_impingement", "rotator_cuff_tear"],
    "knee_extension": ["knee_injury", "patellar_tendinitis", "acl_injury"],
    "knee_flexion": ["knee_injury", "hamstring_strain"],
    "calf": ["achilles_tendinitis", "ankle_injury", "plantar_fasciitis"],
    "core_flexion": ["lower_back_injury", "disc_herniation", "diastasis_recti"],
}

# Exercise-specific high-risk contraindications (overrides pattern-level)
HIGH_RISK_EXERCISE_CONTRAINDICATIONS = {
    # These are ADDITIONAL to pattern-level contraindications
    "behind the neck": ["shoulder_impingement", "rotator_cuff_tear", "cervical_disc"],
    "upright row": ["shoulder_impingement", "rotator_cuff_tear"],
    "good morning": ["lower_back_injury", "disc_herniation", "sciatica"],
    "sissy squat": ["knee_injury", "patellar_tendinitis"],
    "skull crusher": ["elbow_tendinitis", "tennis_elbow"],
    "barbell row": ["lower_back_injury", "disc_herniation"],
    "sumo deadlift": ["hip_impingement", "adductor_strain", "lower_back_injury"],
    "hack squat": ["knee_injury", "lower_back_injury"],
    "leg extension": ["patellar_tendinitis", "acl_injury"],
    "lat pulldown behind": ["shoulder_impingement", "cervical_disc"],
    "snatch": ["shoulder_impingement", "wrist_injury", "lower_back_injury"],
    "clean and jerk": ["shoulder_impingement", "wrist_injury", "lower_back_injury"],
    "kipping": ["shoulder_impingement", "rotator_cuff_tear"],
}


def compute_fatigue_score(name: str, pattern: str, equipment: str, mechanic: str) -> int:
    """Compute fatigue score 1-10 for an exercise"""
    base = BASE_FATIGUE_BY_PATTERN.get(pattern, 3)
    eq_mod = FATIGUE_EQUIP_MODIFIER.get(equipment, 0)
    # Compound exercises are more fatiguing than isolation
    mech_mod = 1 if mechanic == "compound" else -1
    score = base + eq_mod + mech_mod
    # Specific high-fatigue exercises
    nl = name.lower()
    if "deadlift" in nl and "romanian" not in nl:
        score = max(score, 9)  # Conventional deadlifts = peak fatigue
    elif "squat" in nl and "barbell" in (equipment or ""):
        score = max(score, 8)
    elif "clean" in nl or "snatch" in nl or "jerk" in nl:
        score = max(score, 8)  # Olympic lifts = very high fatigue
    return max(1, min(10, score))


def compute_stimulus_score(name: str, pattern: str, equipment: str, mechanic: str) -> int:
    """Compute stimulus score 1-10 for an exercise"""
    base = BASE_STIMULUS_BY_PATTERN.get(pattern, 5)
    # Free weights generally provide better stimulus than machines for compounds
    nl = name.lower()
    if mechanic == "compound":
        if equipment in ("barbell", "dumbbell"):
            base = min(10, base + 1)
    # Isolation with machines can provide better stimulus (constant tension)
    if mechanic == "isolation":
        if equipment in ("cable", "machine"):
            base = min(10, base + 1)
    # Specific high-stimulus exercises
    if "squat" in nl and "barbell" in (equipment or ""):
        base = max(base, 9)
    elif "bench press" in nl:
        base = max(base, 8)
    elif "pull-up" in nl or "pullup" in nl or "chin-up" in nl:
        base = max(base, 8)
    return max(1, min(10, base))


def compute_axial_load(name: str, pattern: str, equipment: str) -> int:
    """Compute axial load 0-10 for an exercise"""
    base = BASE_AXIAL_LOAD_BY_PATTERN.get(pattern, 2)
    eq_mod = AXIAL_EQUIP_MODIFIER.get(equipment, 0)
    score = base + eq_mod
    nl = name.lower()
    # Specific overrides
    if "deadlift" in nl:
        score = max(score, 9)
    elif "back squat" in nl or ("squat" in nl and "barbell" in (equipment or "")):
        score = max(score, 9)
    elif "front squat" in nl:
        score = max(score, 8)
    elif "good morning" in nl:
        score = max(score, 9)
    elif "overhead" in nl and "press" in nl and equipment == "barbell":
        score = max(score, 7)
    elif "seated" in nl or "lying" in nl or "incline" in nl:
        score = max(0, score - 2)  # Seated/lying = less axial
    elif "leg press" in nl:
        score = max(score, 3)  # Leg press has some but much less than squat
    return max(0, min(10, score))


def compute_recovery_hours(pattern: str, mechanic: str, difficulty: int) -> int:
    """Compute recovery time in hours"""
    base = RECOVERY_HOURS_BY_PATTERN.get(pattern, 36)
    # Harder exercises need more recovery
    if difficulty >= 5:
        base += 12
    elif difficulty <= 2:
        base -= 12
    # Isolation recovers faster
    if mechanic == "isolation":
        base = min(base, 48)
    return max(24, min(96, base))


def compute_skill_level(name: str, difficulty: int, mechanic: str) -> str:
    """Determine skill level: beginner, intermediate, or advanced"""
    nl = name.lower()
    for kw in ADVANCED_EXERCISE_KEYWORDS:
        if kw in nl:
            return "advanced"
    for kw in BEGINNER_EXERCISE_KEYWORDS:
        if kw in nl:
            return "beginner"
    if difficulty >= 5:
        return "advanced"
    elif difficulty <= 2:
        return "beginner"
    return "intermediate"


def compute_contraindications(name: str, pattern: str) -> list:
    """Compute contraindications list for an exercise"""
    contras = set()
    # Pattern-level contraindications
    contras.update(CONTRAINDICATION_RULES.get(pattern, []))
    # Exercise-specific high-risk contraindications
    nl = name.lower()
    for keyword, extra_contras in HIGH_RISK_EXERCISE_CONTRAINDICATIONS.items():
        if keyword in nl:
            contras.update(extra_contras)
    return sorted(contras)


def detect_movement_pattern(name: str, force: str, mechanic: str, primary_muscle: str) -> str:
    """Detect movement pattern from exercise properties"""
    name_lower = name.lower()

    # First try keyword matching (most reliable)
    for pattern, keywords in PATTERN_KEYWORDS.items():
        if any(kw in name_lower for kw in keywords):
            return pattern

    # Then try rule-based mapping
    force = (force or "").lower()
    mechanic = (mechanic or "").lower()
    primary = (primary_muscle or "").lower()

    key = (force, mechanic, primary)
    if key in MOVEMENT_PATTERN_RULES:
        return MOVEMENT_PATTERN_RULES[key]

    # Partial matches
    for (f, m, p), pattern in MOVEMENT_PATTERN_RULES.items():
        if f == force and p == primary:
            return pattern

    return "other"


def normalize_exercise_from_free_db(ex: dict) -> dict | None:
    """Normalize a free-exercise-db exercise to our standard schema.
    Returns None if exercise should be filtered out."""
    name = ex.get("name", "").strip()
    primary = ex.get("primaryMuscles", [])
    secondary = ex.get("secondaryMuscles", [])
    equipment = ex.get("equipment") or "body only"
    mechanic = ex.get("mechanic") or "compound"
    force = ex.get("force") or ""
    level = ex.get("level", "intermediate")
    category = (ex.get("category") or "strength").lower().strip()
    instructions = ex.get("instructions", [])

    # ---- FILTER: skip non-training categories ----
    if category not in VALID_CATEGORIES:
        return None

    # ---- Fix equipment from name ----
    equipment = infer_equipment(name, equipment)

    # ---- Fix mechanic from name patterns ----
    mechanic = fix_mechanic(name, mechanic)

    # Standardize muscles using alias mapping
    primary = list(dict.fromkeys(standardize_muscle(m)
                   for m in primary if standardize_muscle(m)))
    secondary = list(dict.fromkeys(standardize_muscle(m)
                     for m in secondary if standardize_muscle(m)))

    # Detect movement pattern
    pm = primary[0] if primary else ""
    pattern = detect_movement_pattern(name, force, mechanic, pm)

    # Determine exercise type
    ex_type = mechanic if mechanic in ("compound", "isolation") else "compound"

    # Difficulty level (1-5) from beginner/intermediate/expert
    diff_map = {"beginner": 2, "intermediate": 3, "expert": 5}
    difficulty = diff_map.get(level, 3)

    # Rep ranges based on exercise type
    rep_ranges = REP_RANGES if ex_type == "compound" else REP_RANGES_ISOLATION

    # Goal suitability
    suitability = GOAL_SUITABILITY.get(ex_type, GOAL_SUITABILITY["compound"])

    # Order priority (compounds first: 1-3, isolation: 4-6)
    order_priority = 2 if ex_type == "compound" else 5

    # ── NEW: 6 science-backed fields ──
    fatigue = compute_fatigue_score(name, pattern, equipment, ex_type)
    stimulus = compute_stimulus_score(name, pattern, equipment, ex_type)
    sfr = round(stimulus / max(fatigue, 1), 2)
    axial = compute_axial_load(name, pattern, equipment)
    recovery = compute_recovery_hours(pattern, ex_type, difficulty)
    skill = compute_skill_level(name, difficulty, ex_type)
    contras = compute_contraindications(name, pattern)

    return {
        "name": name,
        "primaryMuscles": primary,
        "secondaryMuscles": secondary,
        "equipment": equipment,
        "mechanic": ex_type,
        "force": force,
        "movement_pattern": pattern,
        "difficulty_level": difficulty,
        "category": category,
        "instructions": instructions,
        "gifUrl": "",
        "order_priority": order_priority,
        "goal_suitability": suitability,
        "rep_ranges_by_goal": rep_ranges,
        "fatigue_score": fatigue,
        "stimulus_score": stimulus,
        "sfr_ratio": sfr,
        "axial_load": axial,
        "recovery_time_hours": recovery,
        "skill_level": skill,
        "contraindications": contras,
    }


def normalize_exercise_from_strength(ex: dict) -> dict | None:
    """Normalize a strength.json exercise to our standard schema.
    Returns None if exercise should be filtered out."""
    name = ex.get("name", "").strip()
    primary = ex.get("primaryMuscles", [])
    secondary = ex.get("secondaryMuscles", [])
    equipment = ex.get("equipment") or "body only"
    mechanic = ex.get("mechanic") or "compound"
    force = ex.get("force") or ""
    level = ex.get("level", "intermediate")
    category = (ex.get("category") or "strength").lower().strip()
    instructions = ex.get("steps", [])
    if not instructions:
        instructions = ex.get("instructions", [])

    # ---- FILTER: skip non-training categories ----
    if category not in VALID_CATEGORIES:
        return None

    # ---- Fix equipment from name ----
    equipment = infer_equipment(name, equipment)

    # ---- Fix mechanic from name patterns ----
    mechanic = fix_mechanic(name, mechanic)

    # Standardize muscles using alias mapping
    primary = list(dict.fromkeys(standardize_muscle(m)
                   for m in primary if standardize_muscle(m)))
    secondary = list(dict.fromkeys(standardize_muscle(m)
                     for m in secondary if standardize_muscle(m)))

    pm = primary[0] if primary else ""
    pattern = detect_movement_pattern(name, force, mechanic, pm)
    ex_type = mechanic if mechanic in ("compound", "isolation") else "compound"
    diff_map = {"beginner": 2, "intermediate": 3, "expert": 5}
    difficulty = diff_map.get(level, 3)
    rep_ranges = REP_RANGES if ex_type == "compound" else REP_RANGES_ISOLATION
    suitability = GOAL_SUITABILITY.get(ex_type, GOAL_SUITABILITY["compound"])
    order_priority = 2 if ex_type == "compound" else 5

    # ── NEW: 6 science-backed fields ──
    fatigue = compute_fatigue_score(name, pattern, equipment, ex_type)
    stimulus = compute_stimulus_score(name, pattern, equipment, ex_type)
    sfr = round(stimulus / max(fatigue, 1), 2)
    axial = compute_axial_load(name, pattern, equipment)
    recovery = compute_recovery_hours(pattern, ex_type, difficulty)
    skill = compute_skill_level(name, difficulty, ex_type)
    contras = compute_contraindications(name, pattern)

    return {
        "name": name,
        "primaryMuscles": primary,
        "secondaryMuscles": secondary,
        "equipment": equipment,
        "mechanic": ex_type,
        "force": force,
        "movement_pattern": pattern,
        "difficulty_level": difficulty,
        "category": category,
        "instructions": instructions,
        "gifUrl": "",
        "order_priority": order_priority,
        "goal_suitability": suitability,
        "rep_ranges_by_goal": rep_ranges,
        "fatigue_score": fatigue,
        "stimulus_score": stimulus,
        "sfr_ratio": sfr,
        "axial_load": axial,
        "recovery_time_hours": recovery,
        "skill_level": skill,
        "contraindications": contras,
    }


# ── ExerciseDB bodyParts to skip (non-strength categories) ──────────────────
EXERCISEDB_SKIP_BODY_PARTS = {"cardio"}


def normalize_exercise_from_exercisedb(ex: dict) -> dict | None:
    """Normalize an ExerciseDB (v1) exercise to our standard schema.
    Input 'ex' is the already-normalized output from fetch_exercisedb.py.
    Returns None if exercise should be filtered out."""
    name = ex.get("name", "").strip()
    if not name:
        return None

    # Filter cardio / non-strength body parts
    body_parts = [bp.lower() for bp in ex.get("bodyParts", [])]
    if any(bp in EXERCISEDB_SKIP_BODY_PARTS for bp in body_parts):
        return None

    primary_raw = ex.get("primaryMuscles", [])
    secondary_raw = ex.get("secondaryMuscles", [])
    equipment = ex.get("equipment", "body only")
    instructions = ex.get("instructions", [])
    gif_url = ex.get("gifUrl", "")

    # Standardize muscles (our fetch script already normalized names but
    # the alias map will catch anything remaining)
    primary = list(dict.fromkeys(
        standardize_muscle(m) for m in primary_raw if standardize_muscle(m)
    ))
    secondary = list(dict.fromkeys(
        standardize_muscle(m) for m in secondary_raw if standardize_muscle(m)
    ))

    if not primary:
        return None

    # Infer mechanic from name patterns
    mechanic = fix_mechanic(name, "compound")
    ex_type = mechanic

    # Infer movement pattern (no force field in ExerciseDB, use empty string)
    pm = primary[0] if primary else ""
    pattern = detect_movement_pattern(name, "", mechanic, pm)

    # Difficulty: ExerciseDB doesn't provide level, assign based on skill detection
    # We'll compute it after skill detection
    difficulty = 3  # default intermediate
    skill = compute_skill_level(name, difficulty, ex_type)
    if skill == "advanced":
        difficulty = 5
    elif skill == "beginner":
        difficulty = 2

    # Fix equipment from name (in case suffix wasn't caught by fetch script)
    equipment = infer_equipment(name, equipment)

    rep_ranges = REP_RANGES if ex_type == "compound" else REP_RANGES_ISOLATION
    suitability = GOAL_SUITABILITY.get(ex_type, GOAL_SUITABILITY["compound"])
    order_priority = 2 if ex_type == "compound" else 5

    fatigue = compute_fatigue_score(name, pattern, equipment, ex_type)
    stimulus = compute_stimulus_score(name, pattern, equipment, ex_type)
    sfr = round(stimulus / max(fatigue, 1), 2)
    axial = compute_axial_load(name, pattern, equipment)
    recovery = compute_recovery_hours(pattern, ex_type, difficulty)
    contras = compute_contraindications(name, pattern)

    return {
        "name": name,
        "primaryMuscles": primary,
        "secondaryMuscles": secondary,
        "equipment": equipment,
        "mechanic": ex_type,
        "force": "",
        "movement_pattern": pattern,
        "difficulty_level": difficulty,
        "category": "strength",
        "instructions": instructions,
        "gifUrl": gif_url,
        "order_priority": order_priority,
        "goal_suitability": suitability,
        "rep_ranges_by_goal": rep_ranges,
        "fatigue_score": fatigue,
        "stimulus_score": stimulus,
        "sfr_ratio": sfr,
        "axial_load": axial,
        "recovery_time_hours": recovery,
        "skill_level": skill,
        "contraindications": contras,
    }


def main():
    print("=" * 60)
    print("Building Clean Exercise Database v2")
    print("=" * 60)

    # Load sources
    with open(SCRIPT_DIR / "data" / "free_exercise_db.json", 'r') as f:
        free_db = json.load(f)
    print(f"Loaded free-exercise-db: {len(free_db)} exercises")

    with open(SCRIPT_DIR / "data" / "exercises" / "strength.json", 'r') as f:
        strength = json.load(f)
    print(f"Loaded strength.json: {len(strength)} exercises")

    # Normalize free-exercise-db
    merged = []
    seen_names = set()
    filtered_category = 0
    filtered_no_muscle = 0

    for ex in free_db:
        normalized = normalize_exercise_from_free_db(ex)
        if normalized is None:
            filtered_category += 1
            continue
        if not normalized["primaryMuscles"]:
            filtered_no_muscle += 1
            continue
        key = normalized["name"].lower().strip()
        if key not in seen_names:
            merged.append(normalized)
            seen_names.add(key)

    print(
        f"After free-exercise-db: {len(merged)} kept, {filtered_category} filtered (category), {filtered_no_muscle} no muscles")

    # Add unique from strength.json
    added_strength = 0
    filtered_s_cat = 0
    for ex in strength:
        name = ex.get("name", "").lower().strip()
        if name and name not in seen_names:
            normalized = normalize_exercise_from_strength(ex)
            if normalized is None:
                filtered_s_cat += 1
                continue
            if normalized["primaryMuscles"]:
                merged.append(normalized)
                seen_names.add(name)
                added_strength += 1

    print(
        f"Added from strength.json: {added_strength} ({filtered_s_cat} filtered by category)")

    # ── Source 3: ExerciseDB v1 (if raw file exists) ──────────────────────────
    exercisedb_file = SCRIPT_DIR / "data" / "exercisedb_v1_raw.json"
    if exercisedb_file.exists():
        with open(exercisedb_file, encoding="utf-8") as f:
            exercisedb_raw = json.load(f)
        print(
            f"Loaded exercisedb_v1_raw.json: {len(exercisedb_raw)} exercises")

        # Build gifUrl lookup by normalized name for enriching existing exercises
        gif_lookup = {}
        for ex in exercisedb_raw:
            key = ex.get("name", "").strip().lower()
            if key and ex.get("gifUrl"):
                gif_lookup[key] = ex["gifUrl"]

        # Enrich existing exercises with gifUrl where names match
        enriched = 0
        for ex in merged:
            key = ex["name"].lower().strip()
            if not ex.get("gifUrl") and key in gif_lookup:
                ex["gifUrl"] = gif_lookup[key]
                enriched += 1
        print(f"Enriched {enriched} existing exercises with gifUrl")

        # Add genuinely new exercises from ExerciseDB
        added_edb = 0
        filtered_edb = 0
        for ex in exercisedb_raw:
            name_key = ex.get("name", "").strip().lower()
            if name_key and name_key not in seen_names:
                normalized = normalize_exercise_from_exercisedb(ex)
                if normalized is None:
                    filtered_edb += 1
                    continue
                if normalized["primaryMuscles"]:
                    merged.append(normalized)
                    seen_names.add(name_key)
                    added_edb += 1
        print(
            f"Added from ExerciseDB: {added_edb} new ({filtered_edb} filtered by category)")
    else:
        print(f"ExerciseDB raw file not found ({exercisedb_file})")
        print(f"  → Run: python fetch_exercisedb.py   to download it first")

    print(f"Total merged: {len(merged)}")

    # Stats
    by_muscle = defaultdict(int)
    by_pattern = defaultdict(int)
    by_mechanic = defaultdict(int)
    by_equipment = defaultdict(int)

    for ex in merged:
        for m in ex["primaryMuscles"]:
            by_muscle[m] += 1
        by_pattern[ex["movement_pattern"]] += 1
        by_mechanic[ex["mechanic"]] += 1
        by_equipment[ex["equipment"]] += 1

    print(f"\nBy primary muscle:")
    for m in sorted(by_muscle.keys()):
        print(f"  {m}: {by_muscle[m]}")

    print(f"\nBy movement pattern:")
    for p in sorted(by_pattern.keys()):
        print(f"  {p}: {by_pattern[p]}")

    print(f"\nBy mechanic: {dict(by_mechanic)}")

    print(f"\nBy equipment:")
    for e in sorted(by_equipment.keys()):
        print(f"  {e}: {by_equipment[e]}")

    # NEW: Stats for the 6 science-backed fields
    by_skill = defaultdict(int)
    fatigue_vals = []
    stimulus_vals = []
    sfr_vals = []
    axial_vals = []
    recovery_vals = []
    for ex in merged:
        by_skill[ex["skill_level"]] += 1
        fatigue_vals.append(ex["fatigue_score"])
        stimulus_vals.append(ex["stimulus_score"])
        sfr_vals.append(ex["sfr_ratio"])
        axial_vals.append(ex["axial_load"])
        recovery_vals.append(ex["recovery_time_hours"])

    print(f"\nBy skill level: {dict(by_skill)}")
    print(
        f"Fatigue score:  min={min(fatigue_vals)}, max={max(fatigue_vals)}, avg={sum(fatigue_vals)/len(fatigue_vals):.1f}")
    print(
        f"Stimulus score: min={min(stimulus_vals)}, max={max(stimulus_vals)}, avg={sum(stimulus_vals)/len(stimulus_vals):.1f}")
    print(
        f"SFR ratio:      min={min(sfr_vals):.2f}, max={max(sfr_vals):.2f}, avg={sum(sfr_vals)/len(sfr_vals):.2f}")
    print(
        f"Axial load:     min={min(axial_vals)}, max={max(axial_vals)}, avg={sum(axial_vals)/len(axial_vals):.1f}")
    print(
        f"Recovery hours: min={min(recovery_vals)}, max={max(recovery_vals)}, avg={sum(recovery_vals)/len(recovery_vals):.1f}")
    has_contras = sum(1 for ex in merged if ex["contraindications"])
    print(
        f"Exercises with contraindications: {has_contras}/{len(merged)} ({100*has_contras/len(merged):.1f}%)")

    # Verify: check a few known exercises
    name_map = {ex["name"]: ex for ex in merged}
    print("\n=== SPOT CHECK (should be fixed) ===")
    checks = [
        ("Squat – Barbell", "barbell", "compound"),
        ("Incline Bench Press – Dumbbell", "dumbbell", "compound"),
        ("Shoulder Press – Machine", "machine", "compound"),
        ("Chest Fly – Machine", "machine", "isolation"),
        ("Cable Curl – Rope", "cable", "isolation"),
    ]
    for cname, want_eq, want_mech in checks:
        ex = name_map.get(cname)
        if ex:
            eq_ok = "OK" if ex["equipment"] == want_eq else f"WRONG({ex['equipment']})"
            mech_ok = "OK" if ex["mechanic"] == want_mech else f"WRONG({ex['mechanic']})"
            print(f"  {cname}: equip={eq_ok}, mechanic={mech_ok}")
        else:
            print(f"  {cname}: NOT FOUND")

    # Save
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to: {OUTPUT_FILE}")
    print(f"Total clean exercises: {len(merged)}")


if __name__ == "__main__":
    main()
