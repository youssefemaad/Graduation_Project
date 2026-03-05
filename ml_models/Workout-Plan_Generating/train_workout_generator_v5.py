"""
Workout Plan Generator v5 - Qwen2.5-3B-Instruct + QLoRA
=========================================================
Pure AI workout plan generation with:
- Qwen2.5-3B-Instruct (causal LM) with QLoRA (4-bit)
- Clean exercise database (1057 exercises)
- Compact text output format (token-efficient)
- InBody data integration
- Injury handling with severity (1-10)
- Coach feedback learning
- NO weak/strong muscle areas (removed per requirement)
- NO static/mock/fallback data

Hardware target: RTX 4050 6GB VRAM
Training method: QLoRA (4-bit quantization + LoRA adapters)
"""

import json
import random
import os
import sys
import gc
from tqdm.auto import tqdm
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Optional, Tuple, Any

import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    set_seed,
)
from peft import LoraConfig, get_peft_model, TaskType, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig

# Fix OpenMP conflict on Windows
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'
os.environ['USE_TF'] = 'NO'
os.environ['USE_TORCH'] = 'YES'

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
DATA_FILE = SCRIPT_DIR / "data" / "exercises_final.json"
OUTPUT_DIR = SCRIPT_DIR / "models" / "workout-generator-v5"
TRAINING_DATA_FILE = SCRIPT_DIR / "training_data_v5.jsonl"

# Model - Qwen2.5-3B-Instruct with QLoRA
MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
MAX_SEQ_LENGTH = 2048  # Input + output combined for causal LM
SEED = 42
NUM_SAMPLES = 12000  # Diverse training examples

# Training parameters - Optimized for RTX 4050 6GB
EPOCHS = 3
BATCH_SIZE = 1  # Must be 1 for 6GB VRAM with 3B model
GRADIENT_ACCUMULATION = 8  # Effective batch size = 8
# Reduced for QLoRA stability (was 2e-4, causes overshooting)
LEARNING_RATE = 1e-4
MAX_GRAD_NORM = 0.3  # Lower for stability with quantization
WARMUP_RATIO = 0.03
WEIGHT_DECAY = 0.001
LR_SCHEDULER = "cosine"

# QLoRA parameters
QLORA_R = 64  # Rank of LoRA matrices
QLORA_ALPHA = 16  # Scaling factor (alpha/r = scaling)
QLORA_DROPOUT = 0.05
QLORA_TARGET_MODULES = [
    "q_proj", "k_proj", "v_proj", "o_proj",
    "gate_proj", "up_proj", "down_proj"
]

print("=" * 70)
print("Workout Plan Generator v5 - Qwen2.5-3B + QLoRA")
print("=" * 70)
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    total_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"Total GPU Memory: {total_mem:.1f} GB")
    torch.backends.cudnn.benchmark = True
    print(f"GPU Training ENABLED")
else:
    print("WARNING: No GPU detected! QLoRA requires CUDA.")
    print("Consider using Google Colab or a GPU machine.")
print("=" * 70)

set_seed(SEED)

# ============================================================================
# CONSTANTS
# ============================================================================

FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"]
FITNESS_GOALS = ["Strength", "Muscle", "WeightLoss", "Endurance", "General"]

BODY_FAT_CATEGORIES = {
    "lean": (5, 14),
    "normal": (15, 22),
    "higher": (23, 30),
    "obese": (31, 45),
}

MUSCLE_MASS_CATEGORIES = {
    "low": (18, 28),
    "average": (28, 38),
    "high": (38, 55),
}

BODY_PARTS_INJURY = [
    "shoulder", "lower_back", "upper_back", "knee", "ankle",
    "wrist", "elbow", "neck", "hip",
]

INJURY_TYPES = ["strain", "sprain", "soreness",
                "pain", "stiffness", "inflammation"]

SEVERITY_MAP = {
    (1, 3): "mild",
    (4, 6): "moderate",
    (7, 9): "severe",
    (10, 10): "critical",
}

DIFFICULTY_PREFS = ["easier", "normal", "harder"]

RPE_BY_GOAL = {
    "Strength": (8, 10),
    "Muscle": (7, 9),
    "WeightLoss": (6, 8),
    "Endurance": (5, 7),
    "General": (6, 8),
}

COMPOUND_PATTERNS = {
    "squat", "hip_hinge", "horizontal_push",
    "vertical_push", "vertical_pull", "horizontal_pull", "lunge",
}
ISOLATION_PATTERNS = {
    "elbow_flexion", "elbow_extension", "knee_extension",
    "knee_flexion", "calf", "shoulder_raise", "core_flexion",
}

# Prompt templates
PLAN_PROMPTS = [
    "Generate a {days}-day {goal} workout plan",
    "Create a {days}-day {goal} program",
    "Make me a {days} day {goal} routine",
    "I need a {days}-day {goal} workout",
    "{days}-day {goal} split",
    "Build a {days} day {goal} plan",
    "Give me a {goal} workout for {days} days per week",
    "Design a {days}-day {goal} training program",
    "Plan a {days} day {goal} workout routine",
    "{goal} program, {days} days a week",
]

INJURY_ADJUST_PROMPTS = [
    "Adjust my plan for a {part} injury",
    "Modify workout - {part} is injured",
    "Update plan: {part} injury severity {sev}/10",
    "Change exercises for {part} problem",
    "Replace {part} exercises due to injury",
]

# Split templates — each day has 4-5 patterns for exercise variety
SPLIT_TEMPLATES = {
    3: [
        {
            "name": "Push/Pull/Legs",
            "days": [
                {"name": "Push", "patterns": ["horizontal_push", "vertical_push", "elbow_extension", "shoulder_raise"],
                 "muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Pull", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                 "muscles": ["lats", "middle back", "biceps"]},
                {"name": "Legs", "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"],
                 "muscles": ["quadriceps", "hamstrings", "glutes", "calves"]},
            ],
        },
        {
            "name": "Full Body x3",
            "days": [
                {"name": "Full Body A", "patterns": ["horizontal_push", "vertical_pull", "squat", "core_flexion"],
                 "muscles": ["chest", "lats", "quadriceps", "abdominals"]},
                {"name": "Full Body B", "patterns": ["vertical_push", "horizontal_pull", "hip_hinge", "elbow_flexion"],
                 "muscles": ["shoulders", "middle back", "hamstrings", "biceps"]},
                {"name": "Full Body C", "patterns": ["horizontal_push", "horizontal_pull", "lunge", "elbow_extension"],
                 "muscles": ["chest", "lats", "glutes", "triceps"]},
            ],
        },
    ],
    4: [
        {
            "name": "Upper/Lower",
            "days": [
                {"name": "Upper A", "patterns": ["horizontal_push", "horizontal_pull", "elbow_extension", "elbow_flexion"],
                 "muscles": ["chest", "lats", "triceps", "biceps"]},
                {"name": "Lower A", "patterns": ["squat", "hip_hinge", "calf", "core_flexion"],
                 "muscles": ["quadriceps", "hamstrings", "calves", "abdominals"]},
                {"name": "Upper B", "patterns": ["vertical_push", "vertical_pull", "shoulder_raise", "elbow_flexion"],
                 "muscles": ["shoulders", "middle back", "biceps"]},
                {"name": "Lower B", "patterns": ["hip_hinge", "lunge", "squat", "calf"],
                 "muscles": ["hamstrings", "glutes", "quadriceps", "calves"]},
            ],
        },
        {
            "name": "Push/Pull/Legs/Arms",
            "days": [
                {"name": "Push", "patterns": ["horizontal_push", "vertical_push", "elbow_extension"],
                 "muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Pull", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                 "muscles": ["lats", "middle back", "biceps"]},
                {"name": "Legs", "patterns": ["squat", "hip_hinge", "lunge", "calf"],
                 "muscles": ["quadriceps", "hamstrings", "glutes", "calves"]},
                {"name": "Arms + Abs", "patterns": ["elbow_flexion", "elbow_extension", "shoulder_raise", "core_flexion"],
                 "muscles": ["biceps", "triceps", "shoulders", "abdominals"]},
            ],
        },
    ],
    5: [
        {
            "name": "Bro Split",
            "days": [
                {"name": "Chest", "patterns": ["horizontal_push", "elbow_extension"],
                 "muscles": ["chest", "triceps"]},
                {"name": "Back", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                 "muscles": ["lats", "middle back", "biceps"]},
                {"name": "Shoulders", "patterns": ["vertical_push", "shoulder_raise", "core_flexion"],
                 "muscles": ["shoulders", "abdominals"]},
                {"name": "Legs", "patterns": ["squat", "hip_hinge", "lunge", "calf"],
                 "muscles": ["quadriceps", "hamstrings", "glutes", "calves"]},
                {"name": "Arms", "patterns": ["elbow_flexion", "elbow_extension", "shoulder_raise"],
                 "muscles": ["biceps", "triceps", "forearms"]},
            ],
        },
        {
            "name": "ULPPL",
            "days": [
                {"name": "Upper", "patterns": ["horizontal_push", "horizontal_pull", "elbow_extension", "elbow_flexion"],
                 "muscles": ["chest", "lats", "triceps", "biceps"]},
                {"name": "Lower", "patterns": ["squat", "hip_hinge", "lunge", "calf"],
                 "muscles": ["quadriceps", "hamstrings", "glutes", "calves"]},
                {"name": "Push", "patterns": ["horizontal_push", "vertical_push", "elbow_extension", "shoulder_raise"],
                 "muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Pull", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                 "muscles": ["lats", "middle back", "biceps"]},
                {"name": "Legs + Abs", "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"],
                 "muscles": ["quadriceps", "hamstrings", "glutes", "calves", "abdominals"]},
            ],
        },
    ],
    6: [
        {
            "name": "PPL x2",
            "days": [
                {"name": "Push A", "patterns": ["horizontal_push", "vertical_push", "elbow_extension", "shoulder_raise"],
                 "muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Pull A", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                 "muscles": ["lats", "middle back", "biceps"]},
                {"name": "Legs A", "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"],
                 "muscles": ["quadriceps", "hamstrings", "glutes", "calves"]},
                {"name": "Push B", "patterns": ["horizontal_push", "vertical_push", "elbow_extension", "shoulder_raise"],
                 "muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Pull B", "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                 "muscles": ["middle back", "lats", "biceps"]},
                {"name": "Legs B", "patterns": ["hip_hinge", "lunge", "knee_flexion", "calf"],
                 "muscles": ["hamstrings", "glutes", "calves"]},
            ],
        },
    ],
}

# Injury handling rules (severity-aware avoid patterns + related muscles)
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

# System prompt for Qwen2.5
SYSTEM_PROMPT = """You are an expert fitness AI that generates personalized workout plans. You create complete, scientifically-sound training programs based on the user's profile, goals, injuries, and feedback. Plans include periodized volume using MEV/MAV/MRV landmarks, progressive overload protocols, SFR-optimized exercise selection, rest day distribution, and RIR-based intensity prescription. Output plans in compact format only."""


# ════════════════════════════════════════════════════════════════════════
#  VOLUME LANDMARKS (RP Strength research data)
#  MV  = Maintenance Volume (sets/week to maintain gains)
#  MEV = Minimum Effective Volume (minimum to start growing)
#  MAV = Maximum Adaptive Volume (sweet spot range)
#  MRV = Maximum Recoverable Volume (ceiling before overreaching)
#  Freq = recommended training frequency (times/week)
# ════════════════════════════════════════════════════════════════════════
VOLUME_LANDMARKS = {
    "chest":       {"MV": 4,  "MEV": 6,  "MAV": (10, 16), "MRV": 22, "freq": (2, 4)},
    "shoulders":   {"MV": 4,  "MEV": 6,  "MAV": (8, 16),  "MRV": 22, "freq": (2, 4)},
    "triceps":     {"MV": 2,  "MEV": 4,  "MAV": (6, 10),  "MRV": 14, "freq": (2, 4)},
    "biceps":      {"MV": 2,  "MEV": 4,  "MAV": (8, 14),  "MRV": 20, "freq": (2, 4)},
    "lats":        {"MV": 4,  "MEV": 6,  "MAV": (10, 16), "MRV": 20, "freq": (2, 4)},
    "middle back": {"MV": 4,  "MEV": 6,  "MAV": (10, 16), "MRV": 20, "freq": (2, 4)},
    "traps":       {"MV": 0,  "MEV": 4,  "MAV": (6, 12),  "MRV": 20, "freq": (2, 4)},
    "quadriceps":  {"MV": 4,  "MEV": 6,  "MAV": (8, 14),  "MRV": 18, "freq": (2, 5)},
    "hamstrings":  {"MV": 3,  "MEV": 4,  "MAV": (6, 12),  "MRV": 16, "freq": (2, 3)},
    "glutes":      {"MV": 0,  "MEV": 2,  "MAV": (4, 12),  "MRV": 16, "freq": (2, 4)},
    "calves":      {"MV": 4,  "MEV": 6,  "MAV": (8, 16),  "MRV": 20, "freq": (3, 6)},
    "abdominals":  {"MV": 0,  "MEV": 4,  "MAV": (6, 16),  "MRV": 20, "freq": (3, 6)},
    "forearms":    {"MV": 0,  "MEV": 2,  "MAV": (4, 8),   "MRV": 12, "freq": (2, 4)},
    "lower back":  {"MV": 0,  "MEV": 2,  "MAV": (4, 8),   "MRV": 10, "freq": (2, 3)},
    "adductors":   {"MV": 0,  "MEV": 2,  "MAV": (4, 8),   "MRV": 12, "freq": (2, 3)},
    "abductors":   {"MV": 0,  "MEV": 2,  "MAV": (4, 8),   "MRV": 12, "freq": (2, 3)},
    "neck":        {"MV": 0,  "MEV": 2,  "MAV": (3, 6),   "MRV": 10, "freq": (2, 4)},
}

# ════════════════════════════════════════════════════════════════════════
#  PERIODIZATION: Mesocycle structure
#  Based on RP Strength periodization model:
#  - Each mesocycle = 3-6 accumulation weeks + 1 deload week
#  - Volume ramps from ~MEV (week 1) to near MRV (last accumulation week)
#  - RIR decreases: 3-4 RIR (week 1) → 0-1 RIR (peak week)
#  - Rep ranges: heavy(5-10), moderate(10-20), light(20-30)
# ════════════════════════════════════════════════════════════════════════
MESOCYCLE_CONFIGS = {
    "beginner":     {"weeks": 4, "accumulation": 3, "deload": 1},
    "intermediate": {"weeks": 5, "accumulation": 4, "deload": 1},
    "advanced":     {"weeks": 6, "accumulation": 5, "deload": 1},
}

# RIR schedule per week of accumulation (index 0 = week 1)
RIR_BY_WEEK = {
    3: [3, 2, 1],            # Beginner: 3 accum weeks
    4: [4, 3, 2, 1],         # Intermediate: 4 accum weeks
    5: [4, 3, 2, 1, 0],      # Advanced: 5 accum weeks
}

# Volume multiplier per week (fraction of MEV→MRV ramp)
# 0.0 = MEV, 1.0 = MRV, values in between are linear ramp
VOLUME_RAMP = {
    3: [0.0, 0.4, 0.8],
    4: [0.0, 0.3, 0.6, 0.9],
    5: [0.0, 0.2, 0.4, 0.7, 1.0],
}

# ════════════════════════════════════════════════════════════════════════
#  PROGRESSIVE OVERLOAD METHODS (per goal)
# ════════════════════════════════════════════════════════════════════════
PROGRESSIVE_OVERLOAD = {
    "Strength": {
        "method": "Linear Periodization",
        "protocol": "+2.5kg upper/+5kg lower per session when all reps completed",
        "weekly": "If stalled: micro-load +1.25kg or add 1 set",
        "deload": "Drop to 60% of working weight, keep sets, RPE 5-6",
        "reps_signal": "When target reps hit across all sets, increase load next session",
    },
    "Muscle": {
        "method": "Double Progression",
        "protocol": "Hit top of rep range on all sets → increase weight 2.5-5%",
        "weekly": "Add 1 set per muscle group per week up to MRV",
        "deload": "Drop volume to MEV, keep intensity, RPE 5-6",
        "reps_signal": "Achieve top rep range across all working sets before adding load",
    },
    "WeightLoss": {
        "method": "Rep Progression",
        "protocol": "Increase reps before weight, reduce rest 10s per week",
        "weekly": "+1-2 reps per set or -5s rest between sets",
        "deload": "Reduce volume 50%, maintain movement quality",
        "reps_signal": "When able to do 20+ reps with good form, increase load",
    },
    "Endurance": {
        "method": "Volume + Density",
        "protocol": "Add reps weekly, reduce rest periods 5-10s per week",
        "weekly": "+2 reps per set or +1 set if plateau",
        "deload": "Reduce total sets 40%, keep rep range",
        "reps_signal": "When rest periods < 30s and form good, increase load slightly",
    },
    "General": {
        "method": "Undulating Periodization",
        "protocol": "Rotate heavy(5-8)/moderate(8-12)/light(12-15) across the week",
        "weekly": "Waves: W1 moderate, W2 heavy, W3 light, W4 moderate+",
        "deload": "Light week every 4th week, 60% volume",
        "reps_signal": "Increase load when RPE drops below target for 2 consecutive sessions",
    },
}

# ════════════════════════════════════════════════════════════════════════
#  REST DAY SCHEDULES (by training days/week)
# ════════════════════════════════════════════════════════════════════════
REST_DAY_SCHEDULES = {
    3: [
        ["Mon:train", "Tue:rest", "Wed:train", "Thu:rest",
            "Fri:train", "Sat:rest", "Sun:rest"],
        ["Mon:train", "Tue:rest", "Wed:rest", "Thu:train",
            "Fri:rest", "Sat:train", "Sun:rest"],
    ],
    4: [
        ["Mon:train", "Tue:train", "Wed:rest", "Thu:train",
            "Fri:train", "Sat:rest", "Sun:rest"],
        ["Mon:train", "Tue:rest", "Wed:train", "Thu:rest",
            "Fri:train", "Sat:train", "Sun:rest"],
    ],
    5: [
        ["Mon:train", "Tue:train", "Wed:rest", "Thu:train",
            "Fri:train", "Sat:train", "Sun:rest"],
        ["Mon:train", "Tue:train", "Wed:train", "Thu:rest",
            "Fri:train", "Sat:train", "Sun:rest"],
    ],
    6: [
        ["Mon:train", "Tue:train", "Wed:train", "Thu:rest",
            "Fri:train", "Sat:train", "Sun:train"],
    ],
}

# ════════════════════════════════════════════════════════════════════════
#  EXPERT PROGRAM TEMPLATES (real evidence-based programs)
#  Used for ~40% of training data to teach the model real-world programs
# ════════════════════════════════════════════════════════════════════════
EXPERT_PROGRAMS = {
    "Starting Strength 5x5": {
        "goal": "Strength",
        "level": "Beginner",
        "days": 3,
        "split_name": "Full Body A/B",
        "description": "Mark Rippetoe's linear progression novice program",
        "schedule": ["Mon", "Wed", "Fri"],
        "workouts": [
            {
                "name": "Workout A",
                "exercises": [
                    {"pattern": "squat", "name_hint": "barbell squat",
                        "sets": 5, "reps": "5", "rest": 180, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "barbell bench",
                        "sets": 5, "reps": "5", "rest": 180, "mech": "C"},
                    {"pattern": "hip_hinge", "name_hint": "barbell deadlift",
                        "sets": 1, "reps": "5", "rest": 300, "mech": "C"},
                ],
            },
            {
                "name": "Workout B",
                "exercises": [
                    {"pattern": "squat", "name_hint": "barbell squat",
                        "sets": 5, "reps": "5", "rest": 180, "mech": "C"},
                    {"pattern": "vertical_push", "name_hint": "overhead press",
                        "sets": 5, "reps": "5", "rest": 180, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "barbell row",
                        "sets": 5, "reps": "5", "rest": 180, "mech": "C"},
                ],
            },
            {
                "name": "Workout A",
                "exercises": [
                    {"pattern": "squat", "name_hint": "barbell squat",
                        "sets": 5, "reps": "5", "rest": 180, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "barbell bench",
                        "sets": 5, "reps": "5", "rest": 180, "mech": "C"},
                    {"pattern": "hip_hinge", "name_hint": "barbell deadlift",
                        "sets": 1, "reps": "5", "rest": 300, "mech": "C"},
                ],
            },
        ],
        "progression": "Linear:+2.5kg upper/+5kg lower each session",
        "deload": "Every 3-4w when 3 consecutive stalls,drop 10%",
    },
    "Wendler 5/3/1": {
        "goal": "Strength",
        "level": "Intermediate",
        "days": 4,
        "split_name": "Wendler 5/3/1",
        "description": "Jim Wendler's 4-week wave periodization program",
        "schedule": ["Mon", "Tue", "Thu", "Fri"],
        "workouts": [
            {
                "name": "OHP Day",
                "exercises": [
                    {"pattern": "vertical_push", "name_hint": "barbell overhead",
                        "sets": 3, "reps": "5/3/1+", "rest": 180, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "dumbbell bench",
                        "sets": 5, "reps": "10", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "row",
                        "sets": 5, "reps": "10", "rest": 90, "mech": "C"},
                    {"pattern": "elbow_extension", "name_hint": "tricep",
                        "sets": 3, "reps": "10-15", "rest": 60, "mech": "I"},
                    {"pattern": "shoulder_raise", "name_hint": "lateral raise",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Deadlift Day",
                "exercises": [
                    {"pattern": "hip_hinge", "name_hint": "barbell deadlift",
                        "sets": 3, "reps": "5/3/1+", "rest": 240, "mech": "C"},
                    {"pattern": "squat", "name_hint": "leg press",
                        "sets": 5, "reps": "10", "rest": 120, "mech": "C"},
                    {"pattern": "knee_flexion", "name_hint": "leg curl",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "I"},
                    {"pattern": "core_flexion", "name_hint": "ab",
                        "sets": 3, "reps": "10-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Bench Day",
                "exercises": [
                    {"pattern": "horizontal_push", "name_hint": "barbell bench",
                        "sets": 3, "reps": "5/3/1+", "rest": 180, "mech": "C"},
                    {"pattern": "vertical_push", "name_hint": "dumbbell press",
                        "sets": 5, "reps": "10", "rest": 90, "mech": "C"},
                    {"pattern": "vertical_pull", "name_hint": "pull",
                        "sets": 5, "reps": "10", "rest": 90, "mech": "C"},
                    {"pattern": "elbow_flexion", "name_hint": "curl",
                        "sets": 3, "reps": "10-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Squat Day",
                "exercises": [
                    {"pattern": "squat", "name_hint": "barbell squat",
                        "sets": 3, "reps": "5/3/1+", "rest": 240, "mech": "C"},
                    {"pattern": "hip_hinge", "name_hint": "romanian deadlift",
                        "sets": 5, "reps": "10", "rest": 120, "mech": "C"},
                    {"pattern": "lunge", "name_hint": "lunge", "sets": 3,
                        "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "calf", "name_hint": "calf raise",
                        "sets": 4, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
        ],
        "progression": "Wave:W1=5x65/75/85%,W2=3x70/80/90%,W3=5/3/1x75/85/95%,W4=deload",
        "deload": "Every 4th week,40-60% of TM,5x5",
    },
    "PHUL": {
        "goal": "Muscle",
        "level": "Intermediate",
        "days": 4,
        "split_name": "PHUL",
        "description": "Power Hypertrophy Upper Lower - Brandon Campbell",
        "schedule": ["Mon", "Tue", "Thu", "Fri"],
        "workouts": [
            {
                "name": "Upper Power",
                "exercises": [
                    {"pattern": "horizontal_push", "name_hint": "barbell bench",
                        "sets": 4, "reps": "3-5", "rest": 180, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "barbell row",
                        "sets": 4, "reps": "3-5", "rest": 180, "mech": "C"},
                    {"pattern": "vertical_push", "name_hint": "overhead press",
                        "sets": 3, "reps": "5-8", "rest": 120, "mech": "C"},
                    {"pattern": "vertical_pull", "name_hint": "pull-up",
                        "sets": 3, "reps": "5-8", "rest": 120, "mech": "C"},
                    {"pattern": "elbow_flexion", "name_hint": "barbell curl",
                        "sets": 2, "reps": "6-10", "rest": 90, "mech": "I"},
                    {"pattern": "elbow_extension", "name_hint": "skull crusher",
                        "sets": 2, "reps": "6-10", "rest": 90, "mech": "I"},
                ],
            },
            {
                "name": "Lower Power",
                "exercises": [
                    {"pattern": "squat", "name_hint": "barbell squat",
                        "sets": 4, "reps": "3-5", "rest": 240, "mech": "C"},
                    {"pattern": "hip_hinge", "name_hint": "barbell deadlift",
                        "sets": 4, "reps": "3-5", "rest": 240, "mech": "C"},
                    {"pattern": "squat", "name_hint": "leg press", "sets": 3,
                        "reps": "10-12", "rest": 120, "mech": "C"},
                    {"pattern": "knee_flexion", "name_hint": "leg curl",
                        "sets": 3, "reps": "6-10", "rest": 90, "mech": "I"},
                    {"pattern": "calf", "name_hint": "calf raise",
                        "sets": 4, "reps": "6-10", "rest": 90, "mech": "I"},
                ],
            },
            {
                "name": "Upper Hypertrophy",
                "exercises": [
                    {"pattern": "horizontal_push", "name_hint": "incline dumbbell",
                        "sets": 4, "reps": "8-12", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "cable row",
                        "sets": 4, "reps": "8-12", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "fly",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "vertical_pull", "name_hint": "lat pulldown",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "shoulder_raise", "name_hint": "lateral raise",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "elbow_flexion", "name_hint": "hammer curl",
                        "sets": 3, "reps": "10-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Lower Hypertrophy",
                "exercises": [
                    {"pattern": "squat", "name_hint": "front squat",
                        "sets": 4, "reps": "8-12", "rest": 120, "mech": "C"},
                    {"pattern": "hip_hinge", "name_hint": "romanian deadlift",
                        "sets": 4, "reps": "8-12", "rest": 120, "mech": "C"},
                    {"pattern": "lunge", "name_hint": "lunge", "sets": 3,
                        "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "knee_extension", "name_hint": "leg extension",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "knee_flexion", "name_hint": "leg curl",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "calf", "name_hint": "calf raise",
                        "sets": 4, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
        ],
        "progression": "Double:upper body +2.5kg/lower +5kg when all reps completed",
        "deload": "Every 4-6w,volume -40%,intensity -20%",
    },
    "PPL Hypertrophy": {
        "goal": "Muscle",
        "level": "Advanced",
        "days": 6,
        "split_name": "PPL x2 (RP Style)",
        "description": "RP Strength-inspired PPL with volume landmarks and SFR selection",
        "schedule": ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
        "workouts": [
            {
                "name": "Push A (Heavy)",
                "exercises": [
                    {"pattern": "horizontal_push", "name_hint": "barbell bench",
                        "sets": 4, "reps": "6-8", "rest": 150, "mech": "C"},
                    {"pattern": "vertical_push", "name_hint": "overhead press",
                        "sets": 3, "reps": "6-8", "rest": 120, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "incline dumbbell",
                        "sets": 3, "reps": "8-10", "rest": 90, "mech": "C"},
                    {"pattern": "shoulder_raise", "name_hint": "lateral raise",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "elbow_extension", "name_hint": "cable pushdown",
                        "sets": 3, "reps": "10-12", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Pull A (Heavy)",
                "exercises": [
                    {"pattern": "horizontal_pull", "name_hint": "barbell row",
                        "sets": 4, "reps": "6-8", "rest": 150, "mech": "C"},
                    {"pattern": "vertical_pull", "name_hint": "pull-up",
                        "sets": 3, "reps": "6-8", "rest": 120, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "cable row",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "elbow_flexion", "name_hint": "barbell curl",
                        "sets": 3, "reps": "8-10", "rest": 60, "mech": "I"},
                    {"pattern": "elbow_flexion", "name_hint": "hammer curl",
                        "sets": 2, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Legs A (Quad Focus)",
                "exercises": [
                    {"pattern": "squat", "name_hint": "barbell squat",
                        "sets": 4, "reps": "6-8", "rest": 180, "mech": "C"},
                    {"pattern": "squat", "name_hint": "leg press", "sets": 3,
                        "reps": "10-12", "rest": 120, "mech": "C"},
                    {"pattern": "lunge", "name_hint": "lunge", "sets": 3,
                        "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "knee_extension", "name_hint": "leg extension",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "calf", "name_hint": "calf raise",
                        "sets": 4, "reps": "10-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Push B (Volume)",
                "exercises": [
                    {"pattern": "horizontal_push", "name_hint": "dumbbell bench",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "vertical_push", "name_hint": "dumbbell press",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "cable fly",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "shoulder_raise", "name_hint": "lateral raise",
                        "sets": 4, "reps": "15-20", "rest": 45, "mech": "I"},
                    {"pattern": "elbow_extension", "name_hint": "overhead extension",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Pull B (Volume)",
                "exercises": [
                    {"pattern": "vertical_pull", "name_hint": "lat pulldown",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "machine row",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "rear delt",
                        "sets": 3, "reps": "15-20", "rest": 60, "mech": "I"},
                    {"pattern": "elbow_flexion", "name_hint": "cable curl",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "elbow_flexion", "name_hint": "incline curl",
                        "sets": 2, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Legs B (Ham/Glute Focus)",
                "exercises": [
                    {"pattern": "hip_hinge", "name_hint": "romanian deadlift",
                        "sets": 4, "reps": "8-10", "rest": 150, "mech": "C"},
                    {"pattern": "squat", "name_hint": "hack squat",
                        "sets": 3, "reps": "10-12", "rest": 120, "mech": "C"},
                    {"pattern": "knee_flexion", "name_hint": "leg curl",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "hip_hinge", "name_hint": "hip thrust",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "calf", "name_hint": "seated calf raise",
                        "sets": 4, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
        ],
        "progression": "Double:+weight when top reps hit on all sets,+1 set/muscle/week up to MRV",
        "deload": "Every 5-6w,volume to MEV,intensity -10%",
    },
    "Full Body Beginner": {
        "goal": "General",
        "level": "Beginner",
        "days": 3,
        "split_name": "Full Body 3x/wk",
        "description": "ACSM guideline-based beginner full body program",
        "schedule": ["Mon", "Wed", "Fri"],
        "workouts": [
            {
                "name": "Full Body A",
                "exercises": [
                    {"pattern": "squat", "name_hint": "goblet squat",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "dumbbell bench",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "cable row",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "vertical_push", "name_hint": "dumbbell press",
                        "sets": 2, "reps": "10-12", "rest": 60, "mech": "C"},
                    {"pattern": "core_flexion", "name_hint": "plank",
                        "sets": 3, "reps": "30-60s", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Full Body B",
                "exercises": [
                    {"pattern": "hip_hinge", "name_hint": "romanian deadlift",
                        "sets": 3, "reps": "10-12", "rest": 120, "mech": "C"},
                    {"pattern": "vertical_push", "name_hint": "overhead press",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "vertical_pull", "name_hint": "lat pulldown",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "lunge", "name_hint": "lunge", "sets": 2,
                        "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "elbow_flexion", "name_hint": "dumbbell curl",
                        "sets": 2, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Full Body C",
                "exercises": [
                    {"pattern": "squat", "name_hint": "leg press", "sets": 3,
                        "reps": "10-12", "rest": 120, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "push-up",
                        "sets": 3, "reps": "8-15", "rest": 60, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "dumbbell row",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "elbow_extension", "name_hint": "tricep",
                        "sets": 2, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "core_flexion", "name_hint": "crunch",
                        "sets": 3, "reps": "15-20", "rest": 60, "mech": "I"},
                ],
            },
        ],
        "progression": "Linear:+2.5kg when 3x12 completed with RPE<8",
        "deload": "Every 4w,reduce weight 20%,same reps",
    },
    "Upper Lower Intermediate": {
        "goal": "Muscle",
        "level": "Intermediate",
        "days": 4,
        "split_name": "Upper/Lower",
        "description": "Lyle McDonald Generic Bulking Routine inspired",
        "schedule": ["Mon", "Tue", "Thu", "Fri"],
        "workouts": [
            {
                "name": "Upper A (Horizontal)",
                "exercises": [
                    {"pattern": "horizontal_push", "name_hint": "barbell bench",
                        "sets": 3, "reps": "6-8", "rest": 150, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "barbell row",
                        "sets": 3, "reps": "6-8", "rest": 150, "mech": "C"},
                    {"pattern": "vertical_push", "name_hint": "dumbbell press",
                        "sets": 3, "reps": "8-12", "rest": 90, "mech": "C"},
                    {"pattern": "vertical_pull", "name_hint": "pull-up",
                        "sets": 3, "reps": "8-12", "rest": 90, "mech": "C"},
                    {"pattern": "elbow_flexion", "name_hint": "curl",
                        "sets": 2, "reps": "10-12", "rest": 60, "mech": "I"},
                    {"pattern": "elbow_extension", "name_hint": "tricep",
                        "sets": 2, "reps": "10-12", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Lower A (Quad Focus)",
                "exercises": [
                    {"pattern": "squat", "name_hint": "barbell squat",
                        "sets": 3, "reps": "6-8", "rest": 180, "mech": "C"},
                    {"pattern": "hip_hinge", "name_hint": "romanian deadlift",
                        "sets": 3, "reps": "6-8", "rest": 150, "mech": "C"},
                    {"pattern": "lunge", "name_hint": "lunge", "sets": 3,
                        "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "knee_flexion", "name_hint": "leg curl",
                        "sets": 3, "reps": "10-12", "rest": 60, "mech": "I"},
                    {"pattern": "calf", "name_hint": "calf raise",
                        "sets": 4, "reps": "10-15", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Upper B (Vertical)",
                "exercises": [
                    {"pattern": "vertical_push", "name_hint": "overhead press",
                        "sets": 3, "reps": "6-8", "rest": 150, "mech": "C"},
                    {"pattern": "vertical_pull", "name_hint": "lat pulldown",
                        "sets": 3, "reps": "6-8", "rest": 120, "mech": "C"},
                    {"pattern": "horizontal_push", "name_hint": "incline dumbbell",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "horizontal_pull", "name_hint": "cable row",
                        "sets": 3, "reps": "10-12", "rest": 90, "mech": "C"},
                    {"pattern": "shoulder_raise", "name_hint": "lateral raise",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "elbow_flexion", "name_hint": "hammer curl",
                        "sets": 2, "reps": "10-12", "rest": 60, "mech": "I"},
                ],
            },
            {
                "name": "Lower B (Hip Focus)",
                "exercises": [
                    {"pattern": "hip_hinge", "name_hint": "barbell deadlift",
                        "sets": 3, "reps": "5-6", "rest": 240, "mech": "C"},
                    {"pattern": "squat", "name_hint": "leg press", "sets": 3,
                        "reps": "10-12", "rest": 120, "mech": "C"},
                    {"pattern": "hip_hinge", "name_hint": "hip thrust",
                        "sets": 3, "reps": "8-12", "rest": 90, "mech": "C"},
                    {"pattern": "knee_extension", "name_hint": "leg extension",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                    {"pattern": "calf", "name_hint": "seated calf raise",
                        "sets": 3, "reps": "12-15", "rest": 60, "mech": "I"},
                ],
            },
        ],
        "progression": "Double:+weight when top reps hit,weekly set progression +1 to MRV",
        "deload": "Every 5w,volume to MEV,RPE cap 6",
    },
}


# ============================================================================
# WORKOUT GENERATOR V5
# ============================================================================

class WorkoutGeneratorV5:
    """
    Generates training data for Qwen2.5 fine-tuning.
    v5 features: periodization, SFR-based selection, volume landmarks,
    progressive overload, rest day distribution, contraindication checking.
    """

    def __init__(self, exercises: List[Dict]):
        self.exercises = exercises
        self._organize()

    def _organize(self):
        """Organize exercises by pattern, muscle, equipment, and compute SFR index"""
        self.by_pattern = defaultdict(list)
        self.by_muscle = defaultdict(list)
        self.by_equipment = defaultdict(list)
        self.equipment_set = set()

        for ex in self.exercises:
            pat = ex.get("movement_pattern", "other")
            self.by_pattern[pat].append(ex)

            for m in ex.get("primaryMuscles", []):
                self.by_muscle[m].append(ex)

            eq = ex.get("equipment", "body only")
            self.equipment_set.add(eq)
            self.by_equipment[eq].append(ex)

        # Pre-sort each pattern group by SFR ratio (descending) for efficient selection
        for pat in self.by_pattern:
            self.by_pattern[pat].sort(
                key=lambda x: x.get("sfr_ratio", 1.0), reverse=True
            )

        print(f"Organized {len(self.exercises)} exercises:")
        print(
            f"  Patterns: {len(self.by_pattern)} ({', '.join(sorted(self.by_pattern.keys()))})")
        print(f"  Muscles: {len(self.by_muscle)}")
        print(f"  Equipment: {len(self.equipment_set)}")

    def _severity_label(self, sev: int) -> str:
        for (lo, hi), label in SEVERITY_MAP.items():
            if lo <= sev <= hi:
                return label
        return "unknown"

    def _get_week_context(self, level: str) -> Dict:
        """Generate periodization context (which week of mesocycle)"""
        meso_key = level.lower() if level.lower() in MESOCYCLE_CONFIGS else "intermediate"
        meso = MESOCYCLE_CONFIGS[meso_key]
        total_weeks = meso["weeks"]
        accum_weeks = meso["accumulation"]

        # Pick a random week in the mesocycle
        week = random.randint(1, total_weeks)
        is_deload = week > accum_weeks

        if is_deload:
            rir = 5
            # Negative means deload (reduce from prior week)
            volume_frac = -0.4
            phase = "Deload"
        else:
            # Get RIR and volume fraction for this accumulation week
            accum_idx = week - 1
            rir_schedule = RIR_BY_WEEK.get(accum_weeks, RIR_BY_WEEK[4])
            rir = rir_schedule[min(accum_idx, len(rir_schedule) - 1)]
            vol_schedule = VOLUME_RAMP.get(accum_weeks, VOLUME_RAMP[4])
            volume_frac = vol_schedule[min(accum_idx, len(vol_schedule) - 1)]
            phase = "Accumulation"

        return {
            "week": week,
            "total_weeks": total_weeks,
            "phase": phase,
            "is_deload": is_deload,
            "rir": rir,
            "volume_frac": volume_frac,
        }

    def _compute_week_volume(self, muscle: str, volume_frac: float, is_deload: bool) -> int:
        """Compute target weekly sets for a muscle based on volume landmarks"""
        landmarks = VOLUME_LANDMARKS.get(muscle)
        if not landmarks:
            return 6  # Sensible default

        if is_deload:
            return landmarks["MV"]  # Drop to maintenance volume

        mev = landmarks["MEV"]
        mav_lo, mav_hi = landmarks["MAV"]
        mrv = landmarks["MRV"]

        # Interpolate between MEV and MRV based on volume_frac
        target = mev + volume_frac * (mrv - mev)
        # Clamp to MAV range typically
        target = max(mev, min(mrv, target))
        return round(target)

    def _random_user_context(self) -> Dict[str, Any]:
        """Generate random but realistic user context"""
        level = random.choice(FITNESS_LEVELS)
        goal = random.choice(FITNESS_GOALS)
        days = random.choice([3, 4, 5, 6])

        # InBody data (60% of time)
        inbody = None
        if random.random() < 0.6:
            bf_cat = random.choice(list(BODY_FAT_CATEGORIES.keys()))
            mm_cat = random.choice(list(MUSCLE_MASS_CATEGORIES.keys()))
            bf_range = BODY_FAT_CATEGORIES[bf_cat]
            mm_range = MUSCLE_MASS_CATEGORIES[mm_cat]
            inbody = {
                "bf_pct": round(random.uniform(*bf_range), 1),
                "bf_cat": bf_cat,
                "mm_kg": round(random.uniform(*mm_range), 1),
                "mm_cat": mm_cat,
            }

        # Injuries (40% of time)
        injuries = []
        if random.random() < 0.4:
            n_inj = random.randint(1, 2)
            parts = random.sample(BODY_PARTS_INJURY, n_inj)
            for part in parts:
                sev = random.randint(1, 9)
                injuries.append({
                    "part": part,
                    "severity": sev,
                    "type": random.choice(INJURY_TYPES),
                    "label": self._severity_label(sev),
                })

        # Feedback (40% of time)
        feedback = None
        if random.random() < 0.4:
            feedback = {
                "difficulty": random.choice(DIFFICULTY_PREFS),
                "rating": round(random.uniform(3.0, 5.0), 1),
                "sessions": random.randint(5, 60),
            }

        # Equipment subset
        equip_list = sorted(self.equipment_set)
        n_equip = random.randint(4, min(10, len(equip_list)))
        equipment = random.sample(equip_list, n_equip)
        if "body only" not in equipment:
            equipment.append("body only")

        # Periodization context
        week_ctx = self._get_week_context(level)

        return {
            "level": level,
            "goal": goal,
            "days": days,
            "equipment": equipment,
            "inbody": inbody,
            "injuries": injuries,
            "feedback": feedback,
            "week_ctx": week_ctx,
        }

    def _build_user_message(self, ctx: Dict) -> str:
        """Build the user prompt with context"""
        tmpl = random.choice(PLAN_PROMPTS)
        prompt = tmpl.format(days=ctx["days"], goal=ctx["goal"].lower())

        parts = [f"Level: {ctx['level']}",
                 f"Goal: {ctx['goal']}", f"Days: {ctx['days']}"]

        # Periodization context
        wctx = ctx.get("week_ctx", {})
        if wctx:
            parts.append(
                f"Week: {wctx['week']}/{wctx['total_weeks']} ({wctx['phase']})")

        if ctx.get("inbody"):
            ib = ctx["inbody"]
            parts.append(f"Body fat: {ib['bf_pct']}% ({ib['bf_cat']})")
            parts.append(f"Muscle mass: {ib['mm_kg']}kg ({ib['mm_cat']})")

        if ctx.get("injuries"):
            inj_strs = []
            for inj in ctx["injuries"]:
                inj_strs.append(
                    f"{inj['part']}({inj['label']},{inj['severity']}/10)")
            parts.append(f"Injuries: {','.join(inj_strs)}")

        if ctx.get("feedback"):
            fb = ctx["feedback"]
            parts.append(
                f"Feedback: {fb['difficulty']} difficulty, rating {fb['rating']}, {fb['sessions']} sessions done")

        if ctx.get("equipment"):
            parts.append(f"Equipment: {','.join(ctx['equipment'][:8])}")

        return f"{prompt}\n[Context] {' | '.join(parts)}"

    def _check_exercise_contraindications(self, ex: Dict, injuries: List[Dict]) -> bool:
        """Check if exercise is contraindicated for given injuries.
        Returns True if exercise should be AVOIDED."""
        ex_contras = set(ex.get("contraindications", []))
        if not ex_contras:
            return False

        for inj in injuries:
            part = inj["part"]
            sev = inj["severity"]
            # Map injury parts to contraindication terms
            contra_map = {
                "shoulder": ["shoulder_impingement", "rotator_cuff_tear", "pec_tear"],
                "lower_back": ["lower_back_injury", "disc_herniation", "sciatica"],
                "knee": ["knee_injury", "patellar_tendinitis", "acl_injury"],
                "wrist": ["wrist_injury"],
                "elbow": ["elbow_tendinitis", "tennis_elbow", "golfers_elbow", "bicep_tendinitis", "tricep_tendinitis"],
                "hip": ["hip_impingement", "adductor_strain"],
                "ankle": ["ankle_injury", "achilles_tendinitis", "plantar_fasciitis"],
                "neck": ["neck_injury", "cervical_disc"],
                "upper_back": ["lower_back_injury"],  # Similar tissues
            }
            matching_contras = set(contra_map.get(part, []))
            overlap = ex_contras & matching_contras

            if overlap:
                # Severity determines how strict we are
                if sev >= 7:  # Severe: avoid all matching
                    return True
                # Moderate: avoid if any match
                elif sev >= 4 and len(overlap) >= 1:
                    return True
                elif sev >= 2 and len(overlap) >= 2:  # Mild: avoid if multiple
                    return True

        return False

    def _get_exercises_for_day(self, day_tmpl: Dict, ctx: Dict, n: int = 6) -> List[Dict]:
        """Select exercises for a training day using SFR-based ranking,
        injury avoidance, contraindication checking, and equipment filtering."""
        exercises = []
        used = set()
        injuries = ctx.get("injuries", [])
        goal = ctx["goal"]
        level = ctx["level"]
        equipment = [e.lower() for e in ctx.get("equipment", [])]
        week_ctx = ctx.get("week_ctx", {})
        is_deload = week_ctx.get("is_deload", False)

        # During deload, use fewer exercises
        if is_deload:
            n = max(3, n - 2)

        # Determine patterns to avoid from injuries (severity-aware)
        avoid_pats = set()
        for inj in injuries:
            rules = INJURY_RULES.get(inj["part"], {})
            if inj["severity"] >= 7:
                avoid_pats.update(rules.get("avoid_patterns_severe", set()))
            elif inj["severity"] >= 4:
                avoid_pats.update(rules.get("avoid_patterns_moderate", set()))

        # Separate compound and isolation patterns
        day_patterns = day_tmpl["patterns"]
        compound_pats = [p for p in day_patterns if p in COMPOUND_PATTERNS]
        isolation_pats = [p for p in day_patterns if p in ISOLATION_PATTERNS]
        other_pats = [
            p for p in day_patterns if p not in COMPOUND_PATTERNS and p not in ISOLATION_PATTERNS]

        for pattern_group in [compound_pats, isolation_pats, other_pats]:
            for pat in pattern_group:
                if pat in avoid_pats:
                    continue
                if len(exercises) >= n:
                    break

                candidates = self.by_pattern.get(pat, [])
                if not candidates:
                    continue

                # Filter by equipment
                if equipment:
                    filtered = [
                        ex for ex in candidates
                        if ex.get("equipment", "body only").lower() in equipment
                    ]
                    if filtered:
                        candidates = filtered

                # Filter by difficulty for beginners
                if level == "Beginner":
                    filtered = [ex for ex in candidates if ex.get(
                        "difficulty_level", 3) <= 3]
                    if filtered:
                        candidates = filtered
                    # Also filter by skill level
                    filtered = [ex for ex in candidates if ex.get(
                        "skill_level", "intermediate") != "advanced"]
                    if filtered:
                        candidates = filtered

                # Filter by contraindications (exercise-specific)
                if injuries:
                    filtered = [
                        ex for ex in candidates
                        if not self._check_exercise_contraindications(ex, injuries)
                    ]
                    if filtered:
                        candidates = filtered

                # During deload, prefer lower-fatigue exercises (machines, cables)
                if is_deload:
                    deload_filtered = [
                        ex for ex in candidates
                        if ex.get("fatigue_score", 5) <= 5
                    ]
                    if deload_filtered:
                        candidates = deload_filtered

                if not candidates:
                    continue

                # ── SFR-based scoring (replaces simple goal_suitability) ──
                def sfr_score(ex):
                    s = 0.0
                    # Primary: SFR ratio (stimulus/fatigue) — higher is better
                    sfr = ex.get("sfr_ratio", 1.0)
                    s += sfr * 3  # Weight SFR heavily

                    # Secondary: goal suitability
                    gs = ex.get("goal_suitability", {})
                    s += gs.get(goal, gs.get("General", 5))

                    # Bonus for compounds in strength training
                    if goal == "Strength" and ex.get("mechanic") == "compound":
                        s += 2
                    # Bonus for isolation in hypertrophy
                    if goal == "Muscle" and ex.get("mechanic") == "isolation" and pat in ISOLATION_PATTERNS:
                        s += 1
                    # Penalize high-axial-load exercises for weight loss (fatiguing)
                    if goal == "WeightLoss":
                        axial = ex.get("axial_load", 0)
                        if axial >= 7:
                            s -= 1

                    # Randomness for variety (smaller than before — SFR should dominate)
                    s += random.uniform(-0.5, 0.5)
                    return s

                candidates.sort(key=sfr_score, reverse=True)

                # Pick 1-2 exercises per pattern
                picks = 2 if pat in COMPOUND_PATTERNS and not is_deload else 1
                for ex in candidates:
                    if ex["name"] not in used and len(exercises) < n:
                        exercises.append(ex)
                        used.add(ex["name"])
                        picks -= 1
                        if picks <= 0:
                            break

        # Backfill from day's muscle groups if needed
        if len(exercises) < n:
            for muscle in day_tmpl.get("muscles", []):
                if len(exercises) >= n:
                    break
                candidates = [
                    ex for ex in self.by_muscle.get(muscle, [])
                    if ex["name"] not in used
                    and ex.get("movement_pattern", "other") not in avoid_pats
                ]
                if injuries:
                    candidates = [
                        ex for ex in candidates
                        if not self._check_exercise_contraindications(ex, injuries)
                    ]
                if equipment:
                    equip_filtered = [
                        ex for ex in candidates
                        if ex.get("equipment", "body only").lower() in equipment
                    ]
                    if equip_filtered:
                        candidates = equip_filtered

                if candidates:
                    # Sort by SFR for backfill too
                    candidates.sort(key=lambda x: x.get(
                        "sfr_ratio", 1.0), reverse=True)
                    ex = candidates[0]
                    exercises.append(ex)
                    used.add(ex["name"])

        return exercises

    def _format_compact_plan(self, ctx: Dict, split: Dict, day_exercises: List[List[Dict]]) -> str:
        """Format the plan in compact text format with periodization,
        volume tracking, RIR, rest days, and progressive overload."""
        goal = ctx["goal"]
        level = ctx["level"]
        days = ctx["days"]
        injuries = ctx.get("injuries", [])
        feedback = ctx.get("feedback")
        week_ctx = ctx.get("week_ctx", {})
        rpe_range = RPE_BY_GOAL.get(goal, (6, 8))
        week_num = week_ctx.get("week", 1)
        total_weeks = week_ctx.get("total_weeks", 4)
        phase = week_ctx.get("phase", "Accumulation")
        is_deload = week_ctx.get("is_deload", False)
        rir = week_ctx.get("rir", 2)
        volume_frac = week_ctx.get("volume_frac", 0.5)

        GOAL_REPS = {
            "Strength": (3, 6, 180),
            "Muscle": (8, 12, 90),
            "WeightLoss": (12, 20, 45),
            "Endurance": (15, 25, 30),
            "General": (8, 15, 60),
        }
        GOAL_SETS = {"Strength": 4, "Muscle": 3,
                     "WeightLoss": 3, "Endurance": 3, "General": 3}
        default_min_r, default_max_r, default_rest = GOAL_REPS.get(
            goal, (8, 12, 60))
        base_sets = GOAL_SETS.get(goal, 3)
        if level == "Advanced":
            base_sets += 1
        elif level == "Beginner":
            base_sets = max(2, base_sets - 1)

        # Volume adjustment based on week in mesocycle
        if is_deload:
            base_sets = max(2, base_sets - 1)

        lines = []

        # ── Header with periodization info ──
        lines.append(
            f"PLAN:{days}d {split['name']}|{goal}|{level}|{total_weeks}w|W{week_num}/{total_weeks}({phase})")

        # ── Volume landmarks for key muscles this week ──
        muscle_set = set()
        for dt in split["days"]:
            muscle_set.update(dt.get("muscles", []))
        vol_parts = []
        for m in sorted(muscle_set):
            target_sets = self._compute_week_volume(m, volume_frac, is_deload)
            landmarks = VOLUME_LANDMARKS.get(m)
            if landmarks:
                mav_lo, mav_hi = landmarks["MAV"]
                vol_parts.append(
                    f"{m}={target_sets}sets(MAV={mav_lo}-{mav_hi})")
        if vol_parts:
            lines.append(f"VOL:{','.join(vol_parts[:6])}")

        # ── Injury notes ──
        if injuries:
            inj_notes = []
            for inj in injuries:
                rules = INJURY_RULES.get(inj["part"], {})
                if inj["severity"] >= 7:
                    note = rules.get(
                        "severe_note", f"avoid {inj['part']} exercises")
                elif inj["severity"] >= 4:
                    note = rules.get(
                        "moderate_note", f"modify {inj['part']} exercises")
                else:
                    note = rules.get("mild_note", f"monitor {inj['part']}")
                inj_notes.append(
                    f"{inj['part']}({inj['label']},{inj['severity']}/10):{note}")
            lines.append(f"INJ:{';'.join(inj_notes)}")

        # ── Feedback adjustments ──
        if feedback:
            lines.append(
                f"FB:{feedback['difficulty']} pref,rating {feedback['rating']},{feedback['sessions']} sessions")

        # ── Rest day schedule ──
        schedules = REST_DAY_SCHEDULES.get(days, REST_DAY_SCHEDULES[4])
        schedule = random.choice(schedules)
        lines.append(f"SCHED:{','.join(schedule)}")

        # ── Each training day ──
        for i, (day_tmpl, exs) in enumerate(zip(split["days"], day_exercises), 1):
            muscles_str = ",".join(day_tmpl["muscles"][:4])
            dur = random.randint(40, 70)
            if is_deload:
                dur = random.randint(25, 40)
            lines.append("---")
            lines.append(f"D{i}:{day_tmpl['name']}[{muscles_str}]{dur}min")

            for j, ex in enumerate(exs, 1):
                rr = ex.get("rep_ranges_by_goal", {}).get(goal, {})
                sets = rr.get("sets", base_sets)
                min_r = rr.get("min_reps", default_min_r)
                max_r = rr.get("max_reps", default_max_r)
                rest = rr.get("rest_seconds", default_rest)
                mech = "C" if ex.get("mechanic") == "compound" else "I"
                rpe = random.randint(*rpe_range)

                # RIR from periodization context (applies globally)
                ex_rir = rir
                # Isolation exercises get slightly higher RIR (less failure-prone)
                if mech == "I":
                    ex_rir = max(0, rir - 1)

                # Deload adjustments
                if is_deload:
                    sets = max(2, sets - 1)
                    rpe = max(4, rpe - 2)
                    ex_rir = max(3, ex_rir + 2)

                # Feedback adjustments
                if feedback:
                    if feedback["difficulty"] == "harder":
                        sets = min(sets + 1, 6)
                    elif feedback["difficulty"] == "easier":
                        sets = max(sets - 1, 2)

                equip = ex.get("equipment", "body only")
                name = ex["name"]

                # SFR ratio in output (so model learns to reference it)
                sfr = ex.get("sfr_ratio", 1.0)

                # Injury modification markers
                inj_marker = ""
                ex_muscles = set(ex.get("primaryMuscles", []))
                for inj in injuries:
                    rules = INJURY_RULES.get(inj["part"], {})
                    related = rules.get("related_muscles", set())
                    if ex_muscles & related:
                        if inj["severity"] >= 7:
                            inj_marker = "*MODIFIED"
                        elif inj["severity"] >= 4:
                            inj_marker = "*LIGHT"
                        else:
                            inj_marker = "*MONITOR"

                line = f"{j}.{name}|{sets}x{min_r}-{max_r}|{rest}s|{mech}|RPE{rpe}/RIR{ex_rir}|SFR{sfr:.1f}|{equip}"
                if inj_marker:
                    line += f"|{inj_marker}"
                lines.append(line)

        # ── Progressive overload protocol ──
        lines.append("---")
        prog = PROGRESSIVE_OVERLOAD.get(goal, PROGRESSIVE_OVERLOAD["General"])
        lines.append(f"PROG:{prog['method']}|{prog['protocol']}")
        lines.append(f"WEEKLY:{prog['weekly']}")
        lines.append(f"DELOAD:{prog['deload']}")

        return "\n".join(lines)

    def _find_exercise_by_hint(self, pattern: str, name_hint: str, equipment: List[str]) -> Optional[Dict]:
        """Find a matching exercise from DB by pattern and name hint.
        Uses scored matching: prefers closer name matches over partial substring matches."""
        candidates = self.by_pattern.get(pattern, [])
        if not candidates:
            return None

        hint_lower = name_hint.lower()
        equip_lower = [e.lower() for e in equipment] if equipment else []

        # Score candidates by match quality
        scored = []
        for ex in candidates:
            name_lower = ex["name"].lower()
            if hint_lower not in name_lower:
                continue

            # Score: higher = better match
            score = 0
            # Exact match
            if name_lower == hint_lower:
                score = 100
            # Name starts with hint
            elif name_lower.startswith(hint_lower):
                score = 80
            # Hint is a large portion of name (closeness)
            else:
                score = 50 + int(30 * len(hint_lower) /
                                 max(len(name_lower), 1))

            # Equipment bonus
            if equip_lower and ex.get("equipment", "body only").lower() in equip_lower:
                score += 10

            # Free weight bonus for compound movements (prefer barbell/dumbbell over machine)
            if ex.get("equipment", "").lower() in ("barbell", "dumbbell"):
                score += 5

            scored.append((score, ex))

        if scored:
            scored.sort(key=lambda x: x[0], reverse=True)
            return scored[0][1]

        # Fallback: best SFR in pattern with equipment filter
        if equipment:
            filtered = [ex for ex in candidates if ex.get(
                "equipment", "body only").lower() in equip_lower]
            if filtered:
                return filtered[0]  # Already sorted by SFR from _organize

        return candidates[0] if candidates else None

    def generate_example(self) -> Dict:
        """Generate one training example with periodization"""
        ctx = self._random_user_context()
        days = ctx["days"]

        splits = SPLIT_TEMPLATES.get(days, SPLIT_TEMPLATES[4])
        split = random.choice(splits)

        day_exercises = []
        n_ex = 5 if ctx["level"] == "Beginner" else 6
        for day_tmpl in split["days"]:
            exs = self._get_exercises_for_day(day_tmpl, ctx, n=n_ex)
            day_exercises.append(exs)

        user_msg = self._build_user_message(ctx)
        plan_text = self._format_compact_plan(ctx, split, day_exercises)

        return {"user": user_msg, "assistant": plan_text}

    def generate_injury_example(self) -> Dict:
        """Generate injury adjustment example"""
        ctx = self._random_user_context()
        part = random.choice(BODY_PARTS_INJURY)
        sev = random.randint(3, 9)
        ctx["injuries"] = [{
            "part": part,
            "severity": sev,
            "type": random.choice(INJURY_TYPES),
            "label": self._severity_label(sev),
        }]
        ctx["days"] = random.choice([3, 4, 5, 6])

        splits = SPLIT_TEMPLATES.get(ctx["days"], SPLIT_TEMPLATES[4])
        split = random.choice(splits)

        day_exercises = []
        n_ex = 5 if ctx["level"] == "Beginner" else 6
        for day_tmpl in split["days"]:
            exs = self._get_exercises_for_day(day_tmpl, ctx, n=n_ex)
            day_exercises.append(exs)

        tmpl = random.choice(INJURY_ADJUST_PROMPTS)
        prompt = tmpl.format(part=part, sev=sev)

        parts = [f"Level: {ctx['level']}",
                 f"Goal: {ctx['goal']}", f"Days: {ctx['days']}"]
        wctx = ctx.get("week_ctx", {})
        if wctx:
            parts.append(
                f"Week: {wctx['week']}/{wctx['total_weeks']} ({wctx['phase']})")
        parts.append(f"Injury: {part}({self._severity_label(sev)},{sev}/10)")
        if ctx.get("inbody"):
            ib = ctx["inbody"]
            parts.append(f"Body fat: {ib['bf_pct']}%({ib['bf_cat']})")
        if ctx.get("equipment"):
            parts.append(f"Equipment: {','.join(ctx['equipment'][:6])}")

        user_msg = f"{prompt}\n[Context] {' | '.join(parts)}"
        plan_text = self._format_compact_plan(ctx, split, day_exercises)

        return {"user": user_msg, "assistant": plan_text}

    def generate_expert_example(self) -> Dict:
        """Generate example based on a real expert program template.
        Maps template exercises to actual DB exercises for realism."""
        prog_name = random.choice(list(EXPERT_PROGRAMS.keys()))
        prog = EXPERT_PROGRAMS[prog_name]

        # Create a matching user context
        level = prog["level"]
        goal = prog["goal"]
        days = prog["days"]

        # Periodization context
        week_ctx = self._get_week_context(level)

        # Equipment — expert programs typically need barbell, dumbbell, cable, machine
        equip_pool = sorted(self.equipment_set)
        equipment = ["barbell", "dumbbell", "cable", "machine", "body only"]
        # Add a few random extras
        extras = [e for e in equip_pool if e not in equipment]
        equipment.extend(random.sample(extras, min(2, len(extras))))

        # Optional InBody
        inbody = None
        if random.random() < 0.5:
            bf_cat = random.choice(list(BODY_FAT_CATEGORIES.keys()))
            mm_cat = random.choice(list(MUSCLE_MASS_CATEGORIES.keys()))
            inbody = {
                "bf_pct": round(random.uniform(*BODY_FAT_CATEGORIES[bf_cat]), 1),
                "bf_cat": bf_cat,
                "mm_kg": round(random.uniform(*MUSCLE_MASS_CATEGORIES[mm_cat]), 1),
                "mm_cat": mm_cat,
            }

        ctx = {
            "level": level,
            "goal": goal,
            "days": days,
            "equipment": equipment,
            "inbody": inbody,
            "injuries": [],  # Expert programs assume healthy
            "feedback": None,
            "week_ctx": week_ctx,
        }

        # Build user message
        prompt = f"Generate a {days}-day {goal.lower()} program based on {prog_name}"
        parts = [f"Level: {level}", f"Goal: {goal}", f"Days: {days}"]
        if week_ctx:
            parts.append(
                f"Week: {week_ctx['week']}/{week_ctx['total_weeks']} ({week_ctx['phase']})")
        if inbody:
            parts.append(f"Body fat: {inbody['bf_pct']}% ({inbody['bf_cat']})")
            parts.append(
                f"Muscle mass: {inbody['mm_kg']}kg ({inbody['mm_cat']})")
        parts.append(f"Equipment: {','.join(equipment[:6])}")
        user_msg = f"{prompt}\n[Context] {' | '.join(parts)}"

        # Map template exercises to DB exercises
        is_deload = week_ctx.get("is_deload", False)
        rir = week_ctx.get("rir", 2)
        rpe_range = RPE_BY_GOAL.get(goal, (6, 8))
        volume_frac = week_ctx.get("volume_frac", 0.5)

        lines = []
        lines.append(
            f"PLAN:{days}d {prog['split_name']}|{goal}|{level}|{week_ctx['total_weeks']}w|W{week_ctx['week']}/{week_ctx['total_weeks']}({week_ctx['phase']})")

        # Volume landmarks
        all_patterns = set()
        for w in prog["workouts"]:
            for ex_spec in w["exercises"]:
                all_patterns.add(ex_spec["pattern"])
        # Determine muscles from patterns
        pattern_to_muscle = {
            "squat": "quadriceps", "hip_hinge": "hamstrings", "lunge": "glutes",
            "horizontal_push": "chest", "vertical_push": "shoulders",
            "horizontal_pull": "lats", "vertical_pull": "lats",
            "elbow_flexion": "biceps", "elbow_extension": "triceps",
            "shoulder_raise": "shoulders", "knee_extension": "quadriceps",
            "knee_flexion": "hamstrings", "calf": "calves", "core_flexion": "abdominals",
        }
        muscle_set = set(pattern_to_muscle.get(p, "chest")
                         for p in all_patterns)
        vol_parts = []
        for m in sorted(muscle_set):
            target = self._compute_week_volume(m, volume_frac, is_deload)
            landmarks = VOLUME_LANDMARKS.get(m)
            if landmarks:
                lo, hi = landmarks["MAV"]
                vol_parts.append(f"{m}={target}sets(MAV={lo}-{hi})")
        if vol_parts:
            lines.append(f"VOL:{','.join(vol_parts[:6])}")

        # Schedule
        schedules = REST_DAY_SCHEDULES.get(days, REST_DAY_SCHEDULES[4])
        schedule = random.choice(schedules)
        lines.append(f"SCHED:{','.join(schedule)}")

        # Workouts
        for i, workout in enumerate(prog["workouts"], 1):
            lines.append("---")
            dur = random.randint(40, 75)
            if is_deload:
                dur = random.randint(25, 40)
            lines.append(f"D{i}:{workout['name']}|{dur}min")

            for j, ex_spec in enumerate(workout["exercises"], 1):
                # Find matching exercise from DB
                real_ex = self._find_exercise_by_hint(
                    ex_spec["pattern"], ex_spec["name_hint"], equipment
                )
                if not real_ex:
                    continue

                name = real_ex["name"]
                sets = ex_spec["sets"]
                reps = ex_spec["reps"]
                rest = ex_spec["rest"]
                mech = ex_spec["mech"]
                sfr = real_ex.get("sfr_ratio", 1.0)
                rpe = random.randint(*rpe_range)
                ex_rir = rir
                if mech == "I":
                    ex_rir = max(0, rir - 1)
                equip = real_ex.get("equipment", "body only")

                if is_deload:
                    sets = max(2, sets - 1)
                    rpe = max(4, rpe - 2)
                    ex_rir = max(3, ex_rir + 2)

                line = f"{j}.{name}|{sets}x{reps}|{rest}s|{mech}|RPE{rpe}/RIR{ex_rir}|SFR{sfr:.1f}|{equip}"
                lines.append(line)

        # Progression
        lines.append("---")
        lines.append(f"PROG:{prog['progression']}")
        lines.append(f"DELOAD:{prog['deload']}")

        plan_text = "\n".join(lines)
        return {"user": user_msg, "assistant": plan_text}

    def generate_dataset(self, n: int = 10000) -> List[Dict]:
        """Generate full training dataset.
        40% expert programs, 48% regular, 12% injury-specific."""
        data = []
        n_expert = int(n * 0.40)
        n_injury = int(n * 0.12)
        n_regular = n - n_expert - n_injury

        print(
            f"Generating {n_regular} regular + {n_expert} expert + {n_injury} injury examples...")
        for _ in tqdm(range(n_regular), desc="Regular plans"):
            data.append(self.generate_example())

        for _ in tqdm(range(n_expert), desc="Expert programs"):
            data.append(self.generate_expert_example())

        for _ in tqdm(range(n_injury), desc="Injury plans"):
            data.append(self.generate_injury_example())

        random.shuffle(data)
        return data


# ============================================================================
# FORMAT FOR TRAINING
# ============================================================================

def format_chat_for_training(example: Dict, tokenizer) -> str:
    """Format as chat message for Qwen2.5 training"""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": example["user"]},
        {"role": "assistant", "content": example["assistant"]},
    ]
    text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=False)
    return text


# ============================================================================
# MAIN
# ============================================================================

def main():
    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 1: Loading Exercise Database")
    print("=" * 70)

    if not DATA_FILE.exists():
        print(f"ERROR: {DATA_FILE} not found!")
        print("Run build_exercise_db.py first.")
        return

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        exercises = json.load(f)
    print(f"Loaded {len(exercises)} exercises")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 2: Generating Training Data")
    print("=" * 70)

    generator = WorkoutGeneratorV5(exercises)

    if TRAINING_DATA_FILE.exists():
        print(f"Training data exists: {TRAINING_DATA_FILE}")
        resp = input("Regenerate? (y/n): ").strip().lower()
        if resp != "y":
            print("Loading existing data...")
            training_data = []
            with open(TRAINING_DATA_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    training_data.append(json.loads(line))
            print(f"Loaded {len(training_data)} examples")
        else:
            training_data = generator.generate_dataset(NUM_SAMPLES)
            with open(TRAINING_DATA_FILE, "w", encoding="utf-8") as f:
                for item in training_data:
                    f.write(json.dumps(item, ensure_ascii=False) + "\n")
            print(f"Saved {len(training_data)} examples")
    else:
        training_data = generator.generate_dataset(NUM_SAMPLES)
        with open(TRAINING_DATA_FILE, "w", encoding="utf-8") as f:
            for item in training_data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        print(f"Saved {len(training_data)} examples")

    # Preview
    sample = training_data[0]
    print(f"\nSample USER:\n{sample['user'][:200]}")
    print(f"\nSample ASSISTANT:\n{sample['assistant'][:300]}")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 3: Loading Model with QLoRA (4-bit)")
    print("=" * 70)

    # 4-bit quantization config
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
        bnb_4bit_use_double_quant=True,  # Nested quantization for memory savings
    )

    print(f"Loading tokenizer from {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    print(f"Loading model in 4-bit quantization...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
        # PyTorch SDPA: 30-50% faster, built-in (no extra pkg needed)
        attn_implementation="sdpa",
    )

    # Prepare for QLoRA training
    model = prepare_model_for_kbit_training(model)
    model.config.use_cache = False  # Disable KV cache during training

    mem_used = torch.cuda.memory_allocated() / 1e9 if torch.cuda.is_available() else 0
    print(f"Model loaded! VRAM used: {mem_used:.2f} GB")
    print(f"Parameters: {model.num_parameters():,}")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 4: Setting up QLoRA Adapters")
    print("=" * 70)

    lora_config = LoraConfig(
        r=QLORA_R,
        lora_alpha=QLORA_ALPHA,
        target_modules=QLORA_TARGET_MODULES,
        lora_dropout=QLORA_DROPOUT,
        bias="none",
        task_type=TaskType.CAUSAL_LM,
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 5: Preparing Dataset")
    print("=" * 70)

    # Format training data as chat conversations
    print("Formatting as chat messages...")
    formatted_data = []
    for ex in tqdm(training_data, desc="Formatting"):
        text = format_chat_for_training(ex, tokenizer)
        formatted_data.append({"text": text})

    dataset = Dataset.from_list(formatted_data)
    split = dataset.train_test_split(test_size=0.05, seed=SEED)
    print(f"Train: {len(split['train'])}, Eval: {len(split['test'])}")

    # Check token lengths
    sample_tokens = tokenizer(formatted_data[0]["text"], return_tensors="pt")
    print(f"Sample token length: {sample_tokens['input_ids'].shape[1]}")

    # Loss masking: only compute loss on assistant tokens (not system/user)
    # trl 0.29+: assistant_only_loss=True in SFTConfig replaces DataCollatorForCompletionOnlyLM
    print("Loss masking enabled: assistant_only_loss=True (native trl 0.29+)")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 6: Training Configuration")
    print("=" * 70)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    training_args = SFTConfig(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION,
        learning_rate=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
        warmup_ratio=WARMUP_RATIO,
        lr_scheduler_type=LR_SCHEDULER,
        max_grad_norm=MAX_GRAD_NORM,
        logging_dir=str(OUTPUT_DIR / "logs"),
        logging_steps=10,
        eval_strategy="steps",
        eval_steps=200,
        save_strategy="steps",
        save_steps=200,
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        max_seq_length=MAX_SEQ_LENGTH,
        packing=False,  # Must be False with assistant_only_loss; also safer for 6GB VRAM
        # Masks system/user tokens — only trains on assistant responses
        assistant_only_loss=True,
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        optim="paged_adamw_8bit",  # Memory-efficient optimizer for QLoRA
        report_to="tensorboard",
        dataloader_num_workers=0,
        dataloader_pin_memory=True,
        dataset_text_field="text",
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=split["train"],
        eval_dataset=split["test"],
        processing_class=tokenizer,
    )

    print(f"Trainer ready:")
    print(f"  Epochs: {EPOCHS}")
    print(f"  Batch size: {BATCH_SIZE}")
    print(f"  Gradient accumulation: {GRADIENT_ACCUMULATION}")
    print(f"  Effective batch size: {BATCH_SIZE * GRADIENT_ACCUMULATION}")
    print(f"  Learning rate: {LEARNING_RATE}")
    print(f"  Max seq length: {MAX_SEQ_LENGTH}")
    print(f"  Optimizer: paged_adamw_8bit")
    print(f"  Gradient checkpointing: ON")

    # Memory estimate
    if torch.cuda.is_available():
        mem = torch.cuda.memory_allocated() / 1e9
        print(f"  VRAM before training: {mem:.2f} GB")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 7: Training")
    print("=" * 70)
    print(f"Checkpoints: {OUTPUT_DIR}")
    print(f"TensorBoard: tensorboard --logdir {OUTPUT_DIR / 'logs'}")
    print("=" * 70)

    input("\nPress ENTER to start training...")

    try:
        trainer.train()

        print("\n" + "=" * 70)
        print("Training completed!")
        print("=" * 70)

        # Evaluate
        print("\nEvaluating...")
        eval_results = trainer.evaluate()
        print(f"\nFinal Evaluation:")
        for k, v in eval_results.items():
            if isinstance(v, float):
                print(f"  {k}: {v:.4f}")
            else:
                print(f"  {k}: {v}")

        # Save
        print("\nSaving final model...")
        trainer.save_model(str(OUTPUT_DIR))
        tokenizer.save_pretrained(str(OUTPUT_DIR))

        # Save LoRA adapter separately
        lora_dir = OUTPUT_DIR / "lora_adapter"
        model.save_pretrained(str(lora_dir))
        print(f"Model saved: {OUTPUT_DIR}")
        print(f"LoRA adapter saved: {lora_dir}")

        # Save training info
        info = {
            "model": MODEL_NAME,
            "method": "QLoRA",
            "quantization": "4-bit NF4",
            "lora_r": QLORA_R,
            "lora_alpha": QLORA_ALPHA,
            "epochs": EPOCHS,
            "samples": NUM_SAMPLES,
            "exercises": len(exercises),
            "eval_loss": eval_results.get("eval_loss"),
            "timestamp": datetime.now().isoformat(),
            "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        }
        with open(OUTPUT_DIR / "training_info.json", "w") as f:
            json.dump(info, f, indent=2)

        print("\nTraining complete! Model is ready for inference.")

    except KeyboardInterrupt:
        print("\n\nTraining interrupted!")
        print("Saving checkpoint...")
        trainer.save_model(str(OUTPUT_DIR / "interrupted"))
        print(f"Saved to: {OUTPUT_DIR / 'interrupted'}")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
