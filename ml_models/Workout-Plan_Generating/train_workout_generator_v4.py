"""
Workout Plan Generator v4 - Full Personalization Training Script
Incorporates: InBody data, Muscle Scan, Injuries with Severity, User Feedback

Features:
- Simple prompts (what user types)
- Structured context (InBody, scan, injuries, feedback)
- Injury severity handling (1-10 scale)
- Mid-plan injury adjustment support
- Feedback-based difficulty adjustment
"""

from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
    DataCollatorForSeq2Seq,
    set_seed
)
import json
import random
import os
from tqdm.auto import tqdm
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Optional, Tuple, Any
import torch

# Fix OpenMP conflict on Windows
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'
os.environ['USE_TF'] = 'NO'
os.environ['USE_TORCH'] = 'YES'


# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
DATA_FILE = SCRIPT_DIR / "data" / "exercises_comprehensive_real.json"
OUTPUT_DIR = SCRIPT_DIR / "models" / "workout-generator-v4"
TRAINING_DATA_FILE = SCRIPT_DIR / "training_data_v4.jsonl"

# Can upgrade to flan-t5-base for better quality
MODEL_NAME = "google/flan-t5-base"
MAX_INPUT_LENGTH = 512
MAX_OUTPUT_LENGTH = 1280  # Optimized for faster inference
SEED = 42
NUM_SAMPLES = 15000  # Increased for more diverse scenarios

# Training parameters - GPU Optimized
EPOCHS = 3
BATCH_SIZE = 2  # Increase if GPU has 16GB+ VRAM
GRADIENT_ACCUMULATION = 4  # Effective batch size = 8
LEARNING_RATE = 5e-5
MAX_GRAD_NORM = 1.0

print("=" * 70)
print("🏋️ Workout Plan Generator v4 - Full Personalization")
print("=" * 70)
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"Total GPU Memory: {total_memory:.1f} GB")
    torch.cuda.set_per_process_memory_fraction(0.90)  # Use 90% for training
    torch.backends.cudnn.benchmark = True  # Optimize for GPU
    print(f"✅ GPU Training ENABLED (using {total_memory * 0.90:.1f} GB)")
else:
    print("⚠️ WARNING: No GPU detected! Training will be VERY slow.")
    print("   Consider using Google Colab or a GPU-enabled machine.")
print("=" * 70)

set_seed(SEED)


# ============================================================================
# CONSTANTS & LOOKUP TABLES
# ============================================================================

# Fitness levels and goals
FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"]
FITNESS_GOALS = ["Strength", "Muscle", "WeightLoss", "Endurance", "General"]

# Body composition categories (from InBody)
BODY_FAT_CATEGORIES = {
    "lean": (0, 15),       # <15% body fat
    "normal": (15, 22),    # 15-22%
    "higher": (22, 30),    # 22-30%
    "obese": (30, 50)      # 30%+
}

MUSCLE_MASS_CATEGORIES = {
    "low": (15, 25),       # kg
    "average": (25, 35),
    "high": (35, 50)
}

# Body parts for injuries and muscle focus
BODY_PARTS = [
    "shoulder", "lower_back", "upper_back", "knee", "ankle",
    "wrist", "elbow", "neck", "hip", "chest"
]

# Muscle groups for scan results
MUSCLE_GROUPS = [
    "chest", "back", "lats", "shoulders", "front_delts", "rear_delts", "side_delts",
    "biceps", "triceps", "forearms", "abs", "obliques",
    "quads", "hamstrings", "glutes", "calves", "hip_flexors"
]

# Injury types
INJURY_TYPES = ["strain", "sprain", "soreness",
                "pain", "stiffness", "inflammation", "tear"]

# Severity descriptions
SEVERITY_DESCRIPTIONS = {
    (1, 3): "mild",
    (4, 6): "moderate",
    (7, 9): "severe",
    (10, 10): "critical"
}

# Difficulty preferences from feedback
DIFFICULTY_PREFERENCES = ["easier", "normal", "harder"]

# RPE/RIR (Rate of Perceived Exertion / Reps in Reserve)
RPE_BY_GOAL = {
    "Strength": ["RPE 8-9 (1-2 reps in reserve)", "RPE 9-10 (0-1 reps in reserve)"],
    "Muscle": ["RPE 7-8 (2-3 reps in reserve)", "RPE 8-9 (1-2 reps in reserve)"],
    "WeightLoss": ["RPE 6-7 (3-4 reps in reserve)", "RPE 7-8 (2-3 reps in reserve)"],
    "Endurance": ["RPE 5-6 (4-5 reps in reserve)", "RPE 6-7 (3-4 reps in reserve)"],
    "General": ["RPE 6-7 (3-4 reps in reserve)", "RPE 7-8 (2-3 reps in reserve)"]
}

# Exercise Tempo (Eccentric-Pause-Concentric-Pause)
TEMPO_BY_GOAL = {
    "Strength": "3-1-X-0 (controlled eccentric, explosive concentric)",
    "Muscle": "3-0-2-0 (slow and controlled for time under tension)",
    "WeightLoss": "2-0-1-0 (faster pace to maintain heart rate)",
    "Endurance": "2-0-2-0 (steady moderate pace)",
    "General": "2-0-2-0 (normal controlled tempo)"
}

# Compound vs Isolation patterns for ordering
COMPOUND_PATTERNS = ["squat", "hip_hinge", "horizontal_push",
                     "vertical_push", "vertical_pull", "horizontal_pull"]
ISOLATION_PATTERNS = ["elbow_flexion", "elbow_extension", "knee_extension",
                      "knee_flexion", "calf", "shoulder_raise", "core_flexion"]

# Simple prompt templates (what user would say)
SIMPLE_PROMPTS = [
    "Generate a {days}-day {goal} plan",
    "Create a {days}-day workout for {goal}",
    "Make me a {days} day {goal} program",
    "I need a {days}-day {goal} workout",
    "{days}-day {goal} split please",
    "Build a {days} day {goal} routine",
    "Give me a {goal} workout, {days} days",
    "Can you create a {days}-day {goal} plan?",
    "Looking for a {days} day {goal} program",
    "{goal} workout for {days} days per week"
]

# Injury adjustment prompts (for mid-plan modifications)
INJURY_ADJUST_PROMPTS = [
    "Adjust my plan - I got a {body_part} injury",
    "Modify my workout, hurt my {body_part}",
    "Update plan for {body_part} injury",
    "Change exercises, {body_part} is injured",
    "Replace {body_part} exercises - injured"
]

# Split templates by days
SPLIT_TEMPLATES = {
    3: [
        {
            "name": "Push/Pull/Legs",
            "days": [
                {"name": "Push Day", "patterns": ["horizontal_push", "vertical_push", "elbow_extension"],
                 "muscle_groups": ["chest", "shoulders", "triceps"]},
                {"name": "Pull Day", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                 "muscle_groups": ["back", "lats", "biceps", "rear_delts"]},
                {"name": "Leg Day", "patterns": ["squat", "hip_hinge", "calf", "core_flexion"],
                 "muscle_groups": ["quads", "hamstrings", "glutes", "calves", "abs"]}
            ]
        },
        {
            "name": "Full Body",
            "days": [
                {"name": "Full Body A", "patterns": ["squat", "horizontal_push", "vertical_pull"],
                 "muscle_groups": ["quads", "chest", "back"]},
                {"name": "Full Body B", "patterns": ["hip_hinge", "vertical_push", "horizontal_pull"],
                 "muscle_groups": ["hamstrings", "shoulders", "lats"]},
                {"name": "Full Body C", "patterns": ["lunge", "horizontal_push", "vertical_pull", "elbow_flexion"],
                 "muscle_groups": ["legs", "chest", "back", "biceps"]}
            ]
        }
    ],
    4: [
        {
            "name": "Upper/Lower",
            "days": [
                {"name": "Upper A (Push Focus)", "patterns": ["horizontal_push", "vertical_push", "horizontal_pull", "elbow_extension"],
                 "muscle_groups": ["chest", "shoulders", "back", "triceps"]},
                {"name": "Lower A (Quad Focus)", "patterns": ["squat", "knee_extension", "calf", "core_flexion"],
                 "muscle_groups": ["quads", "glutes", "calves", "abs"]},
                {"name": "Upper B (Pull Focus)", "patterns": ["vertical_pull", "horizontal_pull", "shoulder_raise", "elbow_flexion"],
                 "muscle_groups": ["back", "lats", "shoulders", "biceps"]},
                {"name": "Lower B (Hamstring Focus)", "patterns": ["hip_hinge", "knee_flexion", "lunge", "calf"],
                 "muscle_groups": ["hamstrings", "glutes", "calves"]}
            ]
        },
        {
            "name": "Push/Pull/Legs/Arms",
            "days": [
                {"name": "Push Day", "patterns": ["horizontal_push", "vertical_push", "elbow_extension"],
                 "muscle_groups": ["chest", "shoulders", "triceps"]},
                {"name": "Pull Day", "patterns": ["vertical_pull", "horizontal_pull"],
                 "muscle_groups": ["back", "lats", "rear_delts"]},
                {"name": "Leg Day", "patterns": ["squat", "hip_hinge", "calf"],
                 "muscle_groups": ["quads", "hamstrings", "glutes", "calves"]},
                {"name": "Arms & Core", "patterns": ["elbow_flexion", "elbow_extension", "core_flexion"],
                 "muscle_groups": ["biceps", "triceps", "abs"]}
            ]
        }
    ],
    5: [
        {
            "name": "Bro Split",
            "days": [
                {"name": "Chest Day", "patterns": ["horizontal_push"],
                 "muscle_groups": ["chest", "front_delts"]},
                {"name": "Back Day", "patterns": ["horizontal_pull", "vertical_pull"],
                 "muscle_groups": ["back", "lats", "rear_delts"]},
                {"name": "Shoulder Day", "patterns": ["vertical_push", "shoulder_raise"],
                 "muscle_groups": ["shoulders", "side_delts", "rear_delts"]},
                {"name": "Leg Day", "patterns": ["squat", "hip_hinge", "calf"],
                 "muscle_groups": ["quads", "hamstrings", "glutes", "calves"]},
                {"name": "Arms Day", "patterns": ["elbow_flexion", "elbow_extension"],
                 "muscle_groups": ["biceps", "triceps", "forearms"]}
            ]
        }
    ],
    6: [
        {
            "name": "PPL x2",
            "days": [
                {"name": "Push A", "patterns": ["horizontal_push", "vertical_push", "elbow_extension"],
                 "muscle_groups": ["chest", "shoulders", "triceps"]},
                {"name": "Pull A", "patterns": ["vertical_pull", "horizontal_pull", "elbow_flexion"],
                 "muscle_groups": ["back", "lats", "biceps"]},
                {"name": "Legs A", "patterns": ["squat", "knee_extension", "calf"],
                 "muscle_groups": ["quads", "glutes", "calves"]},
                {"name": "Push B", "patterns": ["horizontal_push", "vertical_push", "shoulder_raise"],
                 "muscle_groups": ["chest", "shoulders", "side_delts"]},
                {"name": "Pull B", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                 "muscle_groups": ["back", "rear_delts", "biceps"]},
                {"name": "Legs B", "patterns": ["hip_hinge", "knee_flexion", "calf"],
                 "muscle_groups": ["hamstrings", "glutes", "calves"]}
            ]
        }
    ]
}

# Exercise replacements for injuries
INJURY_EXERCISE_REPLACEMENTS = {
    "shoulder": {
        "avoid_patterns": ["vertical_push", "shoulder_raise"],
        "replacements": {
            "vertical_push": ["neutral_grip_press", "machine_press"],
            "shoulder_raise": ["cable_face_pull", "rear_delt_fly"]
        },
        "severe_skip": ["overhead_press", "lateral_raise", "upright_row"]
    },
    "lower_back": {
        "avoid_patterns": ["hip_hinge"],
        "replacements": {
            "hip_hinge": ["leg_curl", "machine_row"],
            "squat": ["leg_press", "hack_squat"]
        },
        "severe_skip": ["deadlift", "barbell_row", "good_morning"]
    },
    "knee": {
        "avoid_patterns": ["squat", "lunge"],
        "replacements": {
            "squat": ["leg_press_partial", "leg_extension"],
            "lunge": ["step_up_low", "hip_thrust"]
        },
        "severe_skip": ["squat", "lunge", "leg_press"]
    },
    "wrist": {
        "avoid_patterns": ["horizontal_push"],
        "replacements": {
            "horizontal_push": ["machine_chest_press", "pec_deck"],
            "elbow_flexion": ["machine_curl", "cable_curl"]
        },
        "severe_skip": ["barbell_curl", "bench_press", "push_up"]
    },
    "elbow": {
        "avoid_patterns": ["elbow_flexion", "elbow_extension"],
        "replacements": {
            "elbow_flexion": ["hammer_curl_light"],
            "elbow_extension": ["machine_tricep"]
        },
        "severe_skip": ["tricep_dip", "skull_crusher", "close_grip_bench"]
    }
}


# ============================================================================
# PERSONALIZED WORKOUT GENERATOR V4
# ============================================================================

class PersonalizedWorkoutGeneratorV4:
    """
    Generates training data for personalized workout plans with:
    - InBody data integration
    - Muscle scan weak/strong areas
    - Injury handling with severity
    - Feedback-based adjustments
    """

    def __init__(self, exercises: List[Dict]):
        self.exercises = exercises
        self._organize_exercises()

    def _organize_exercises(self):
        """Organize exercises by pattern, muscle, equipment"""
        self.by_pattern = defaultdict(list)
        self.by_muscle = defaultdict(list)
        self.by_equipment = defaultdict(list)
        self.all_equipment = set()

        for ex in self.exercises:
            pattern = ex.get('movement_pattern', 'other')
            self.by_pattern[pattern].append(ex)

            for muscle in ex.get('targetMuscles', []):
                if muscle:
                    self.by_muscle[muscle.lower()].append(ex)

            for eq in ex.get('equipments', ['body weight']):
                eq_lower = eq.lower()
                self.all_equipment.add(eq_lower)
                self.by_equipment[eq_lower].append(ex)

        print(f"✅ Organized {len(self.exercises)} exercises")
        print(f"   - Movement patterns: {len(self.by_pattern)}")
        print(f"   - Muscle groups: {len(self.by_muscle)}")
        print(f"   - Equipment types: {len(self.all_equipment)}")

    def _generate_user_context(self) -> Dict[str, Any]:
        """Generate realistic user context with all features"""

        # Basic profile
        fitness_level = random.choice(FITNESS_LEVELS)
        goal = random.choice(FITNESS_GOALS)
        days = random.choice([3, 4, 5, 6])

        # InBody data (present 50% of time - more balanced)
        inbody = None
        if random.random() < 0.5:
            bf_category = random.choice(list(BODY_FAT_CATEGORIES.keys()))
            mm_category = random.choice(list(MUSCLE_MASS_CATEGORIES.keys()))
            bf_range = BODY_FAT_CATEGORIES[bf_category]
            mm_range = MUSCLE_MASS_CATEGORIES[mm_category]

            inbody = {
                "body_fat_percent": round(random.uniform(bf_range[0], bf_range[1]), 1),
                "body_fat_category": bf_category,
                "muscle_mass_kg": round(random.uniform(mm_range[0], mm_range[1]), 1),
                "muscle_mass_category": mm_category
            }

        # Muscle scan - weak/strong areas (present 60% of time)
        weak_areas = []
        strong_areas = []
        if random.random() < 0.6:
            # Pick 1-3 weak areas
            weak_count = random.randint(1, 3)
            weak_areas = random.sample(MUSCLE_GROUPS, weak_count)

            # Pick 1-2 strong areas (different from weak)
            available = [m for m in MUSCLE_GROUPS if m not in weak_areas]
            strong_count = random.randint(1, 2)
            strong_areas = random.sample(
                available, min(strong_count, len(available)))

        # Injuries with severity (present 50% of time - more training data)
        injuries = []
        if random.random() < 0.5:
            injury_count = random.randint(1, 2)
            injury_parts = random.sample(BODY_PARTS, injury_count)

            for part in injury_parts:
                severity = random.randint(1, 9)  # 1-9, rarely 10
                injury_type = random.choice(INJURY_TYPES)

                injuries.append({
                    "body_part": part,
                    "severity": severity,
                    "type": injury_type,
                    "severity_category": self._get_severity_category(severity)
                })

        # Feedback history (present 50% of time)
        feedback = None
        if random.random() < 0.5:
            feedback = {
                "difficulty_preference": random.choice(DIFFICULTY_PREFERENCES),
                "avg_rating": round(random.uniform(3.0, 5.0), 1),
                "sessions_completed": random.randint(5, 50)
            }

            # Sometimes add weight adjustment preferences
            if random.random() < 0.3:
                feedback["weight_adjustments"] = random.choice([
                    {"compound": "increase", "isolation": "maintain"},
                    {"upper_body": "increase", "lower_body": "maintain"},
                    {"all": "increase"},
                    {"all": "decrease"}
                ])

        # Equipment available
        equipment = random.sample(
            list(self.all_equipment),
            min(random.randint(4, 10), len(self.all_equipment))
        )

        return {
            "fitness_level": fitness_level,
            "goal": goal,
            "days_per_week": days,
            "equipment": equipment,
            "inbody": inbody,
            "weak_areas": weak_areas,
            "strong_areas": strong_areas,
            "injuries": injuries,
            "feedback": feedback
        }

    def _get_severity_category(self, severity: int) -> str:
        """Convert numeric severity to category"""
        for (low, high), category in SEVERITY_DESCRIPTIONS.items():
            if low <= severity <= high:
                return category
        return "unknown"

    def _get_exercises_for_day(
        self,
        day_template: Dict,
        context: Dict[str, Any],
        num_exercises: int = 6
    ) -> List[Dict]:
        """Get exercises for a day, respecting injuries and preferences with compound-first ordering"""

        exercises = []
        used_names = set()

        injuries = context.get("injuries", [])
        weak_areas = context.get("weak_areas", [])
        goal = context.get("goal", "Muscle")
        fitness_level = context.get("fitness_level", "Intermediate")
        equipment = context.get("equipment", [])

        # Build list of patterns to avoid due to injuries
        avoid_patterns = set()
        severe_skip = set()

        for injury in injuries:
            body_part = injury["body_part"]
            severity = injury["severity"]

            if body_part in INJURY_EXERCISE_REPLACEMENTS:
                replacement_info = INJURY_EXERCISE_REPLACEMENTS[body_part]

                if severity >= 7:  # Severe - skip entirely
                    avoid_patterns.update(
                        replacement_info.get("avoid_patterns", []))
                    severe_skip.update(replacement_info.get("severe_skip", []))
                elif severity >= 4:  # Moderate - use replacements
                    avoid_patterns.update(
                        replacement_info.get("avoid_patterns", []))

        # PRIORITIZE COMPOUNDS FIRST (scientifically correct)
        compound_patterns = [
            p for p in day_template["patterns"] if p in COMPOUND_PATTERNS]
        isolation_patterns = [
            p for p in day_template["patterns"] if p in ISOLATION_PATTERNS]

        # Process compounds first
        for pattern in compound_patterns:
            if pattern in avoid_patterns:
                continue

            candidates = self.by_pattern.get(pattern, [])
            if not candidates:
                continue

            # Filter by equipment
            if equipment:
                equipment_lower = [e.lower() for e in equipment]
                candidates = [
                    ex for ex in candidates
                    if any(eq.lower() in equipment_lower
                           for eq in ex.get('equipments', ['body weight']))
                ]

            # Filter by fitness level
            if fitness_level == "Beginner":
                candidates = [ex for ex in candidates if ex.get(
                    'difficulty_level', 3) <= 3]

            # Filter out severely injured exercises
            candidates = [
                ex for ex in candidates
                if ex['name'].lower() not in severe_skip
            ]

            # Score and sort
            def score_exercise(ex):
                score = 0

                # Goal suitability
                goal_key = goal if goal in ex.get(
                    'goal_suitability', {}) else 'Muscle'
                score += ex.get('goal_suitability', {}).get(goal_key, 5)

                # Bonus for targeting weak areas
                for target in ex.get('targetMuscles', []):
                    if any(weak.lower() in target.lower() for weak in weak_areas):
                        score += 3  # Prioritize weak areas

                # Order priority (lower is better for compounds first)
                score -= ex.get('order_priority', 5) * 0.5

                return score

            candidates = sorted(candidates, key=score_exercise, reverse=True)

            # Pick top 1-2 exercises from this pattern
            for ex in candidates[:2]:
                if ex['name'] not in used_names and len(exercises) < num_exercises:
                    exercises.append(ex)
                    used_names.add(ex['name'])

        # Then process isolation exercises
        for pattern in isolation_patterns:
            if pattern in avoid_patterns:
                continue

            candidates = self.by_pattern.get(pattern, [])
            if not candidates:
                continue

            # Filter by equipment
            if equipment:
                equipment_lower = [e.lower() for e in equipment]
                candidates = [
                    ex for ex in candidates
                    if any(eq.lower() in equipment_lower
                           for eq in ex.get('equipments', ['body weight']))
                ]

            # Filter by fitness level
            if fitness_level == "Beginner":
                candidates = [ex for ex in candidates if ex.get(
                    'difficulty_level', 3) <= 3]

            # Filter out severely injured exercises
            candidates = [
                ex for ex in candidates
                if ex['name'].lower() not in severe_skip
            ]

            # Score isolation exercises (same logic)
            def score_exercise(ex):
                score = 0
                goal_key = goal if goal in ex.get(
                    'goal_suitability', {}) else 'Muscle'
                score += ex.get('goal_suitability', {}).get(goal_key, 5)
                for target in ex.get('targetMuscles', []):
                    if any(weak.lower() in target.lower() for weak in weak_areas):
                        score += 3
                score -= ex.get('order_priority', 5) * 0.5
                return score

            candidates = sorted(candidates, key=score_exercise, reverse=True)

            # Pick exercises
            for ex in candidates[:2]:
                if ex['name'] not in used_names and len(exercises) < num_exercises:
                    exercises.append(ex)
                    used_names.add(ex['name'])

        return exercises

    def _format_exercise(self, ex: Dict, context: Dict[str, Any]) -> Dict:
        """Format exercise with goal-specific parameters"""
        goal = context.get("goal", "Muscle")
        goal_key = goal if goal in ex.get(
            'rep_ranges_by_goal', {}) else 'Muscle'

        rep_config = ex.get('rep_ranges_by_goal', {}).get(goal_key, {
            'min_reps': 8, 'max_reps': 12, 'rest_seconds': 90, 'sets': 3
        })

        # Adjust based on feedback
        feedback = context.get("feedback")
        sets = rep_config.get('sets', 3)

        if feedback:
            if feedback.get("difficulty_preference") == "harder":
                sets += 1
            elif feedback.get("difficulty_preference") == "easier":
                sets = max(2, sets - 1)

        # Check if this targets a weak area
        weak_areas = context.get("weak_areas", [])
        is_weak_area = any(
            weak.lower() in target.lower()
            for target in ex.get('targetMuscles', [])
            for weak in weak_areas
        )

        priority = "high (weak area focus)" if is_weak_area else "normal"
        if is_weak_area:
            sets += 1  # Extra set for weak areas

        # Get RPE/RIR for this goal
        rpe = random.choice(RPE_BY_GOAL.get(goal, RPE_BY_GOAL["Muscle"]))

        # Get tempo for this goal
        tempo = TEMPO_BY_GOAL.get(goal, TEMPO_BY_GOAL["Muscle"])

        # Check if compound exercise (needs warm-up)
        is_compound = ex.get('exercise_type') == 'compound'
        warm_up = None
        if is_compound:
            warm_up = [
                "1x5 @ 50% working weight",
                "1x3 @ 70% working weight",
                "1x1 @ 90% working weight"
            ]

        result = {
            "name": ex['name'].title(),
            "sets": str(sets),
            "reps": f"{rep_config['min_reps']}-{rep_config['max_reps']}",
            "rest": f"{rep_config['rest_seconds']} sec",
            "intensity": rpe,
            "tempo": tempo,
            "target_muscles": ex.get('targetMuscles', [])[:3],
            "equipment": ex.get('equipments', ['body weight'])[0] if ex.get('equipments') else 'body weight',
            "movement_pattern": ex.get('movement_pattern', 'other'),
            "exercise_type": ex.get('exercise_type', 'isolation'),
            "priority": priority,
            "notes": self._get_exercise_note(ex, context)
        }

        if warm_up:
            result["warm_up_sets"] = warm_up

        return result

    def _get_exercise_note(self, ex: Dict, context: Dict[str, Any]) -> str:
        """Generate contextual notes for exercises with severity awareness"""
        notes = []

        injuries = context.get("injuries", [])
        for injury in injuries:
            severity = injury["severity"]
            body_part = injury["body_part"]
            targets = [t.lower() for t in ex.get('targetMuscles', [])]

            if any(body_part in t or t in body_part for t in targets):
                if severity >= 7:
                    notes.append(
                        f"⚠️ MODIFIED: Avoiding {body_part} stress (severity {severity}/10)")
                elif severity >= 4:
                    notes.append(
                        f"⚡ ADJUSTED: Use light load on {body_part} (severity {severity}/10)")
                else:
                    notes.append(
                        f"✓ MONITOR: Watch {body_part} discomfort (severity {severity}/10)")

        if not notes:
            notes = [
                "Focus on controlled movement",
                "Full range of motion",
                "Mind-muscle connection",
                "Squeeze at peak contraction"
            ]
            return random.choice(notes)

        return "; ".join(notes)

    def _build_simple_prompt(self, context: Dict[str, Any]) -> str:
        """Build simple user-facing prompt"""
        template = random.choice(SIMPLE_PROMPTS)
        goal = context["goal"].lower()
        days = context["days_per_week"]

        return template.format(days=days, goal=goal)

    def _build_context_string(self, context: Dict[str, Any]) -> str:
        """Build structured context string for training"""
        parts = []

        parts.append(f"Level: {context['fitness_level']}")
        parts.append(f"Goal: {context['goal']}")
        parts.append(f"Days: {context['days_per_week']}")

        # InBody
        if context.get("inbody"):
            ib = context["inbody"]
            parts.append(
                f"Body: {ib['body_fat_category']} fat ({ib['body_fat_percent']}%), {ib['muscle_mass_category']} muscle ({ib['muscle_mass_kg']}kg)")

        # Weak/Strong areas
        if context.get("weak_areas"):
            parts.append(f"Weak areas: {', '.join(context['weak_areas'])}")
        if context.get("strong_areas"):
            parts.append(f"Strong areas: {', '.join(context['strong_areas'])}")

        # Injuries
        if context.get("injuries"):
            injury_strs = []
            for inj in context["injuries"]:
                injury_strs.append(
                    f"{inj['body_part']} ({inj['severity_category']}, {inj['severity']}/10)")
            parts.append(f"Injuries: {', '.join(injury_strs)}")

        # Feedback
        if context.get("feedback"):
            fb = context["feedback"]
            parts.append(
                f"Feedback: prefers {fb['difficulty_preference']}, avg rating {fb['avg_rating']}")

        return " | ".join(parts)

    def generate_plan(self, context: Dict[str, Any]) -> Dict:
        """Generate complete workout plan based on context"""

        days = context["days_per_week"]
        goal = context["goal"]
        fitness_level = context["fitness_level"]

        # Select split template
        split_options = SPLIT_TEMPLATES.get(days, SPLIT_TEMPLATES[4])
        split = random.choice(split_options)

        # Build plan name
        plan_name_parts = [f"{days}-Day {goal} {split['name']}"]

        if context.get("weak_areas"):
            plan_name_parts.append(
                f"({context['weak_areas'][0].title()} Focus)")

        if context.get("injuries"):
            severe_injuries = [
                i for i in context["injuries"] if i["severity"] >= 7]
            if severe_injuries:
                plan_name_parts.append(
                    f"({severe_injuries[0]['body_part'].title()} Safe)")

        plan = {
            "plan_name": " ".join(plan_name_parts),
            "fitness_level": fitness_level,
            "goal": goal,
            "days_per_week": days,
            "program_duration_weeks": random.choice([4, 6, 8, 12]),
            "days": []
        }

        # Add personalization notes
        personalization_notes = []

        if context.get("weak_areas"):
            personalization_notes.append(
                f"Extra volume added for: {', '.join(context['weak_areas'])}")

        if context.get("injuries"):
            for inj in context["injuries"]:
                if inj["severity"] >= 7:
                    personalization_notes.append(
                        f"Avoided {inj['body_part']} exercises (severe injury)")
                elif inj["severity"] >= 4:
                    personalization_notes.append(
                        f"Modified exercises for {inj['body_part']} (moderate injury)")

        if context.get("feedback"):
            fb = context["feedback"]
            if fb["difficulty_preference"] == "harder":
                personalization_notes.append(
                    "Increased volume based on feedback preference")
            elif fb["difficulty_preference"] == "easier":
                personalization_notes.append(
                    "Reduced volume based on feedback preference")

        if personalization_notes:
            plan["personalization_notes"] = personalization_notes

        # Generate each day
        for i, day_template in enumerate(split['days'], 1):
            exercises = self._get_exercises_for_day(day_template, context)

            day = {
                "day_number": i,
                "day_name": f"Day {i}: {day_template['name']}",
                "focus_areas": day_template['muscle_groups'][:4],
                "estimated_duration_minutes": random.randint(45, 75),
                "exercises": [self._format_exercise(ex, context) for ex in exercises]
            }

            plan["days"].append(day)

        # Progressive overload
        plan["progressive_overload"] = {
            "type": "Double Progression",
            "increase_when": "All sets hit top of rep range",
            "weight_increase": "2.5kg upper body, 5kg lower body",
            "progression_rate": "Weekly for beginners, bi-weekly for advanced"
        }

        # Deload week
        plan["deload_week"] = {
            "frequency": "Every 4-6 weeks",
            "method": random.choice([
                "Reduce volume by 40-50% (keep intensity)",
                "Reduce intensity by 20% (keep volume)",
                "Full rest week (active recovery only)"
            ]),
            "signs_needed": "Persistent fatigue, decreased performance, joint pain"
        }

        return plan

    def generate_training_example(self) -> Dict:
        """Generate a single training example"""

        # Generate user context
        context = self._generate_user_context()

        # Build simple prompt
        prompt = self._build_simple_prompt(context)

        # Build context string
        context_str = self._build_context_string(context)

        # Generate plan
        plan = self.generate_plan(context)

        # Combine for training input
        training_input = f"{prompt}\n\n[Context]\n{context_str}"
        training_output = json.dumps(plan, ensure_ascii=False)

        return {
            "input": training_input,
            "output": training_output
        }

    def generate_injury_adjustment_example(self) -> Dict:
        """Generate example for mid-plan injury adjustment"""

        # First generate a base plan
        context = self._generate_user_context()
        context["injuries"] = []  # Start without injuries

        base_plan = self.generate_plan(context)

        # Now add a new injury
        new_injury = {
            "body_part": random.choice(BODY_PARTS),
            "severity": random.randint(4, 8),
            "type": random.choice(INJURY_TYPES),
            "severity_category": ""
        }
        new_injury["severity_category"] = self._get_severity_category(
            new_injury["severity"])

        context["injuries"] = [new_injury]

        # Generate adjusted plan
        adjusted_plan = self.generate_plan(context)
        adjusted_plan[
            "adjustment_reason"] = f"Modified for new {new_injury['body_part']} injury (severity {new_injury['severity']}/10)"

        # Build prompt
        prompt_template = random.choice(INJURY_ADJUST_PROMPTS)
        prompt = prompt_template.format(body_part=new_injury["body_part"])

        context_str = f"New injury: {new_injury['body_part']} ({new_injury['severity_category']}, {new_injury['severity']}/10)"

        training_input = f"{prompt}\n\n[Context]\n{context_str}"
        training_output = json.dumps(adjusted_plan, ensure_ascii=False)

        return {
            "input": training_input,
            "output": training_output
        }

    def generate_dataset(self, n: int = 10000) -> List[Dict]:
        """Generate training dataset"""
        dataset = []

        # 85% regular plans, 15% injury adjustments
        regular_count = int(n * 0.85)
        adjustment_count = n - regular_count

        print(f"Generating {regular_count} regular plans...")
        for _ in tqdm(range(regular_count), desc="Regular plans"):
            dataset.append(self.generate_training_example())

        print(f"Generating {adjustment_count} injury adjustment plans...")
        for _ in tqdm(range(adjustment_count), desc="Injury adjustments"):
            dataset.append(self.generate_injury_adjustment_example())

        random.shuffle(dataset)
        return dataset


# ============================================================================
# MAIN TRAINING SCRIPT
# ============================================================================

def main():
    print("\n" + "=" * 70)
    print("STEP 1: Loading Exercise Database")
    print("=" * 70)

    if not DATA_FILE.exists():
        print(f"❌ ERROR: Data file not found: {DATA_FILE}")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        exercises = json.load(f)

    print(f"✅ Loaded {len(exercises)} exercises")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 2: Generating Training Data")
    print("=" * 70)

    generator = PersonalizedWorkoutGeneratorV4(exercises)

    if TRAINING_DATA_FILE.exists():
        print(f"⚠️ Training data file already exists: {TRAINING_DATA_FILE}")
        response = input("Do you want to regenerate it? (y/n): ")
        if response.lower() != 'y':
            print("Loading existing training data...")
            training_data = []
            with open(TRAINING_DATA_FILE, 'r', encoding='utf-8') as f:
                for line in f:
                    training_data.append(json.loads(line))
            print(f"✅ Loaded {len(training_data)} training examples")
        else:
            training_data = generator.generate_dataset(NUM_SAMPLES)
            with open(TRAINING_DATA_FILE, 'w', encoding='utf-8') as f:
                for item in training_data:
                    f.write(json.dumps(item, ensure_ascii=False) + '\n')
            print(
                f"✅ Generated and saved {len(training_data)} training examples")
    else:
        training_data = generator.generate_dataset(NUM_SAMPLES)
        with open(TRAINING_DATA_FILE, 'w', encoding='utf-8') as f:
            for item in training_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        print(f"✅ Generated and saved {len(training_data)} training examples")

    # Preview
    print("\n📋 Sample training example:")
    sample = training_data[0]
    print(f"INPUT:\n{sample['input'][:300]}...")
    print(f"\nOUTPUT (plan name): {json.loads(sample['output'])['plan_name']}")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 3: Loading Model and Tokenizer")
    print("=" * 70)

    print(f"Loading from {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    # Force GPU usage if available
    if torch.cuda.is_available():
        model = AutoModelForSeq2SeqLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,  # Use FP16 for GPU
            device_map="auto"  # Automatically use GPU
        )
        print("✅ Model loaded on GPU with FP16 precision")
    else:
        model = AutoModelForSeq2SeqLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float32
        )
        print("⚠️ Model loaded on CPU (SLOW)")

    print(f"✅ Model loaded! Parameters: {model.num_parameters():,}")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 4: Setting up LoRA")
    print("=" * 70)

    lora_config = LoraConfig(
        r=64,
        lora_alpha=128,
        target_modules=["q", "v", "k", "o", "wi", "wo"],
        lora_dropout=0.05,
        bias="none",
        task_type=TaskType.SEQ_2_SEQ_LM,
        inference_mode=False
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 5: Preparing Dataset")
    print("=" * 70)

    dataset = Dataset.from_list(training_data)
    split_dataset = dataset.train_test_split(test_size=0.1, seed=SEED)
    print(
        f"✅ Train: {len(split_dataset['train'])}, Test: {len(split_dataset['test'])}")

    def preprocess_function(examples):
        model_inputs = tokenizer(
            examples['input'],
            max_length=MAX_INPUT_LENGTH,
            padding='max_length',
            truncation=True,
            return_tensors=None
        )

        labels = tokenizer(
            examples['output'],
            max_length=MAX_OUTPUT_LENGTH,
            padding='max_length',
            truncation=True,
            return_tensors=None
        )

        model_inputs['labels'] = labels['input_ids']
        return model_inputs

    print("Tokenizing dataset...")
    tokenized_dataset = split_dataset.map(
        preprocess_function,
        batched=True,
        remove_columns=['input', 'output'],
        desc="Tokenizing"
    )
    print("✅ Dataset tokenized!")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 6: Training Configuration")
    print("=" * 70)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    training_args = Seq2SeqTrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION,
        learning_rate=LEARNING_RATE,
        weight_decay=0.01,
        warmup_ratio=0.1,
        max_grad_norm=MAX_GRAD_NORM,
        logging_dir=str(OUTPUT_DIR / 'logs'),
        logging_steps=25,
        eval_strategy="steps",
        eval_steps=250,
        save_strategy="steps",
        save_steps=250,
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        fp16=torch.cuda.is_available(),
        bf16=False,
        dataloader_num_workers=0,
        dataloader_pin_memory=True,
        gradient_checkpointing=False,
        optim="adamw_torch",
        report_to="tensorboard",
        predict_with_generate=True,
        generation_max_length=MAX_OUTPUT_LENGTH,
        generation_num_beams=4,
    )

    data_collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer,
        model=model,
        padding=True
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset['train'],
        eval_dataset=tokenized_dataset['test'], 
        processing_class=tokenizer,
        data_collator=data_collator,
    )

    print(f"✅ Trainer configured")
    print(f"   Epochs: {EPOCHS}")
    print(f"   Batch size: {BATCH_SIZE}")
    print(f"   Gradient accumulation: {GRADIENT_ACCUMULATION}")
    print(f"   Effective batch size: {BATCH_SIZE * GRADIENT_ACCUMULATION}")
    print(f"   Learning rate: {LEARNING_RATE}")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 7: Starting Training 🚀")
    print("=" * 70)
    print(f"Training will save checkpoints to: {OUTPUT_DIR}")
    print(f"Monitor with: tensorboard --logdir {OUTPUT_DIR / 'logs'}")
    print("=" * 70)

    input("\nPress ENTER to start training...")

    try:
        trainer.train()

        print("\n" + "=" * 70)
        print("✅ Training completed successfully!")
        print("=" * 70)

        print("\nEvaluating model...")
        eval_results = trainer.evaluate()
        print(f"\n📊 Final Evaluation Results:")
        for key, value in eval_results.items():
            print(f"   {key}: {value:.4f}")

        print("\nSaving final model...")
        trainer.save_model(str(OUTPUT_DIR))
        tokenizer.save_pretrained(str(OUTPUT_DIR))

        lora_dir = OUTPUT_DIR / "lora_adapter"
        model.save_pretrained(str(lora_dir))

        print(f"\n✅ Model saved to: {OUTPUT_DIR}")
        print(f"✅ LoRA adapter saved to: {lora_dir}")
        print("\n🎉 Training complete! Your personalized workout generator is ready.")

    except KeyboardInterrupt:
        print("\n\n⚠️ Training interrupted!")
        print(f"Latest checkpoint saved in: {OUTPUT_DIR}")
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
