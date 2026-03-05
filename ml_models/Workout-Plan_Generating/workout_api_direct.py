"""
FastAPI service with direct database access for frontend integration
Optimized for performance - frontend calls directly, retrieves user context via RAG
"""
import asyncio
import json
import time
import asyncpg
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel
import re
import torch
import sys
import os

# Fix OMP: Error #15: Initializing libomp.dll, but found libiomp5md.dll already initialized.
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# torch MUST be imported before peft/transformers so its DLLs load correctly on Windows


# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')  # type: ignore

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "models", "workout-generator-v3")
BASE_MODEL = "google/flan-t5-small"
MODEL_VERSION = "v3.0.0-direct"

print("=" * 60)
print("🏋️ Starting Workout Plan Generator API (Direct Mode)")
print("=" * 60)
print(f"📂 Model Directory: {MODEL_DIR}")
print(f"🤖 Base Model: {BASE_MODEL}")
print("⏳ Loading model... (this may take a few moments)")

# Determine device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🖥️ Using device: {device}")

try:
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    print("✅ Tokenizer loaded")

    # Optimize: Use float16 for GPU inference (faster + less VRAM)
    torch_dtype = torch.float16 if device == "cuda" else torch.float32
    print(f"   Dtype: {torch_dtype}")

    base_model = AutoModelForSeq2SeqLM.from_pretrained(
        BASE_MODEL, torch_dtype=torch_dtype
    )
    print("✅ Base model loaded")
    model = PeftModel.from_pretrained(base_model, MODEL_DIR)
    model = model.to(device)
    print("✅ LoRA adapter loaded")
    model.eval()
    print("✅ Model ready for inference")
    print("=" * 60)
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print(f"❌ Please check that the model files exist in: {MODEL_DIR}")
    raise

app = FastAPI(
    title="Workout Plan Generator ML Service (Direct)",
    version=MODEL_VERSION,
    description="Optimized FastAPI with PostgreSQL RAG for frontend direct calls"
)

# CORS Configuration - Allow frontend to call directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://localhost:3001",
        "https://your-production-domain.com"  # Update with your production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None

# Database configuration (from appsettings.Development.json)
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "PulseGym_v1.0.1",
    "user": "postgres",
    "password": "123"
}


# ============================================================
# Database Connection Management
# ============================================================

@app.on_event("startup")
async def startup():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            database=DB_CONFIG["database"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            min_size=2,
            max_size=10
        )
        print("✅ Database connection pool created")
    except Exception as e:
        print(f"❌ Failed to create database pool: {e}")
        raise


@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()
        print("✅ Database connection pool closed")


# ============================================================
# Request/Response Models
# ============================================================

class DirectWorkoutRequest(BaseModel):
    """Request payload for direct frontend calls"""
    user_id: int
    fitness_level: str = "Beginner"
    goal: str = "Muscle"
    days_per_week: int = 4
    equipment: List[str] = Field(default_factory=list)
    injuries: List[str] = Field(default_factory=list)
    include_user_context: bool = False  # Default to false since tables may not exist


class DirectWorkoutResponse(BaseModel):
    """Response payload for direct frontend calls"""
    plan: Optional[Dict[str, Any]] = None
    is_valid_json: bool = False
    model_version: str = MODEL_VERSION
    generation_latency_ms: int = 0
    user_context_retrieved: bool = False
    error: Optional[str] = None


class SavePlanRequest(BaseModel):
    """Request to save generated plan to backend"""
    user_id: int
    plan: Dict[str, Any]
    generation_latency_ms: int
    model_version: str


# ============================================================
# RAG: User Context Retrieval from Database
# ============================================================

async def retrieve_user_context(user_id: int) -> Dict[str, Any]:
    """
    Retrieve user context from PostgreSQL using RAG pattern
    Returns: Dictionary with InBody, MuscleScan, and StrengthProfile data
    """
    if not db_pool:
        print("⚠️ Database pool not available")
        return {}

    context = {}

    try:
        async with db_pool.acquire() as conn:
            # 1. Get latest InBody measurement
            try:
                inbody_row = await conn.fetchrow("""
                    SELECT "MuscleMass", "BodyFatPercentage", "CreatedAt"
                    FROM "InBodyMeasurements"
                    WHERE "UserId" = $1
                    ORDER BY "CreatedAt" DESC
                    LIMIT 1
                """, user_id)

                if inbody_row:
                    context["inbody_data"] = {
                        "muscle_mass_kg": float(inbody_row["MuscleMass"]) if inbody_row["MuscleMass"] else None,
                        "body_fat_percent": float(inbody_row["BodyFatPercentage"]) if inbody_row["BodyFatPercentage"] else None,
                        "skeletal_muscle_mass": float(inbody_row["MuscleMass"]) if inbody_row["MuscleMass"] else None
                    }
                    print(f"✅ Retrieved InBody data for user {user_id}")
            except Exception as e:
                print(f"⚠️ InBody query failed: {e}")

            # 2. Get latest muscle development scan
            try:
                scan_row = await conn.fetchrow("""
                    SELECT "UnderdevelopedMuscles", "WellDevelopedMuscles", "ScanDate"
                    FROM "MuscleDevelopmentScans"
                    WHERE "UserId" = $1
                    ORDER BY "ScanDate" DESC
                    LIMIT 1
                """, user_id)

                if scan_row:
                    context["muscle_scan"] = {
                        "weak_areas": scan_row["UnderdevelopedMuscles"] if scan_row["UnderdevelopedMuscles"] else [],
                        "strong_areas": scan_row["WellDevelopedMuscles"] if scan_row["WellDevelopedMuscles"] else []
                    }
                    print(f"✅ Retrieved muscle scan for user {user_id}")
            except Exception as e:
                print(f"⚠️ Muscle scan query failed: {e}")

            # 3. Get strength profile (top exercises)
            try:
                strength_rows = await conn.fetch("""
                    SELECT "ExerciseName", "OneRepMax", "ConfidenceScore"
                    FROM "UserStrengthProfiles"
                    WHERE "UserId" = $1
                    ORDER BY "LastUpdated" DESC
                    LIMIT 10
                """, user_id)

                if strength_rows:
                    context["strength_profile"] = [
                        {
                            "exercise": row["ExerciseName"],
                            "one_rep_max": float(row["OneRepMax"]) if row["OneRepMax"] else None,
                            "confidence": float(row["ConfidenceScore"]) if row["ConfidenceScore"] else None
                        }
                        for row in strength_rows
                    ]
                    print(
                        f"✅ Retrieved {len(strength_rows)} strength profiles for user {user_id}")
            except Exception as e:
                print(f"⚠️ Strength profile query failed: {e}")

        return context

    except Exception as e:
        print(f"❌ Error retrieving user context: {e}")
        return {}


def _infer_goal_from_inbody(context: Dict[str, Any], user_goal: str) -> tuple[str, str]:
    """
    Intelligently adjust the workout goal based on InBody data.
    Returns (adjusted_goal, explanation_for_prompt).

    Rules:
      - Body fat > 25% (male) / > 32% (female) → suggest weight loss
      - Body fat 18-25% with low muscle mass → suggest muscle building
      - Body fat < 15% → suggest strength or muscle maintenance
      - Otherwise keep user's chosen goal
    """
    if not context or "inbody_data" not in context:
        return user_goal, ""

    inbody = context["inbody_data"]
    body_fat = inbody.get("body_fat_percent")
    muscle_mass = inbody.get("muscle_mass_kg")

    if body_fat is None:
        return user_goal, ""

    explanation = ""
    adjusted_goal = user_goal

    if body_fat > 25:
        # High body fat → prioritize weight loss / fat burning
        if user_goal.lower() not in ["weightloss", "weight loss", "cardio"]:
            adjusted_goal = "WeightLoss"
            explanation = (f"Body fat is {body_fat}% (above healthy range). "
                           f"Plan adjusted to prioritize fat loss with higher reps, "
                           f"shorter rest periods, and circuit-style training. "
                           f"Include supersets and HIIT cardio finishers.")
        else:
            explanation = (f"Body fat is {body_fat}%. "
                           f"Emphasize metabolic conditioning, high rep ranges (12-20), "
                           f"and compound movements for maximum calorie burn.")
    elif body_fat > 18:
        # Moderate body fat
        if muscle_mass and muscle_mass < 30:
            # Low muscle + moderate fat → body recomposition
            explanation = (f"Body fat: {body_fat}%, Muscle mass: {muscle_mass}kg. "
                           f"Focus on body recomposition: moderate weight with controlled tempo, "
                           f"8-12 rep range, compound movements.")
        else:
            explanation = f"Body fat: {body_fat}%. Good range for {user_goal.lower()} training."
    elif body_fat < 15:
        # Lean → focus on strength/muscle maintenance
        if user_goal.lower() in ["weightloss", "weight loss"]:
            adjusted_goal = "Muscle"
            explanation = (f"Body fat is already {body_fat}% (lean). "
                           f"Plan adjusted to muscle building instead of further fat loss. "
                           f"Focus on progressive overload and hypertrophy (8-12 reps).")
        else:
            explanation = (f"Body fat: {body_fat}% (lean). "
                           f"Good for {user_goal.lower()} with focus on progressive overload.")

    return adjusted_goal, explanation


def build_prompt_with_context(req: DirectWorkoutRequest, context: Dict[str, Any]) -> str:
    """
    Build a natural language prompt from the structured request and user context.
    Intelligently adjusts the goal based on InBody data and adds specific
    injury-related instructions.
    """
    # ── Step 1: Infer goal from InBody data ──
    adjusted_goal, body_explanation = _infer_goal_from_inbody(
        context, req.goal)

    prompt_parts = [
        f"Generate a {req.days_per_week}-day workout plan for a {req.fitness_level.lower()} level person",
        f"with the goal of {adjusted_goal.lower()}."
    ]

    # Add body composition insight
    if body_explanation:
        prompt_parts.append(body_explanation)

    if req.equipment:
        prompt_parts.append(
            f"Available equipment: {', '.join(req.equipment)}.")
    else:
        prompt_parts.append("Full gym access with all equipment.")

    # ── Step 2: Detailed injury instructions ──
    if req.injuries:
        injury_instructions = {
            "Lower Back": "AVOID all deadlifts, barbell rows, squats, crunches, and sit-ups. USE seated/supported exercises instead.",
            "Shoulder": "AVOID overhead pressing, bench press, dips, and lateral raises. USE cable and machine-based chest/back exercises.",
            "Knee": "AVOID squats, lunges, leg press, leg extensions, and jumping. USE ham curls, hip thrusts, and upper body focus.",
            "Wrist": "AVOID barbell work, push-ups, and heavy gripping. USE machines and cables with padded handles.",
            "Elbow": "AVOID skull crushers, heavy curls, dips, and pull-ups. USE cables and machines with controlled range.",
            "Hip": "AVOID squats, deadlifts, lunges, hip thrusts, and running. USE leg extensions, leg curls, and upper body.",
            "Ankle": "AVOID squats, lunges, calf raises, jumping, and running. USE seated leg work and upper body exercises.",
        }
        for injury in req.injuries:
            instruction = injury_instructions.get(
                injury, f"Avoid exercises that stress the {injury}.")
            prompt_parts.append(f"INJURY [{injury}]: {instruction}")

    # ── Step 3: Add user context from DB (RAG) ──
    if context:
        if "inbody_data" in context:
            inbody = context["inbody_data"]
            if inbody.get("body_fat_percent"):
                prompt_parts.append(
                    f"Body fat: {inbody['body_fat_percent']}%.")
            if inbody.get("muscle_mass_kg"):
                prompt_parts.append(
                    f"Muscle mass: {inbody['muscle_mass_kg']}kg.")

        if "muscle_scan" in context:
            scan = context["muscle_scan"]
            if scan.get("weak_areas"):
                prompt_parts.append(
                    f"Focus on weak areas: {', '.join(scan['weak_areas'])}.")
            if scan.get("strong_areas"):
                prompt_parts.append(
                    f"Well-developed: {', '.join(scan['strong_areas'])}.")

        if "strength_profile" in context:
            top_lifts = context["strength_profile"][:3]  # Top 3
            for lift in top_lifts:
                if lift.get("one_rep_max"):
                    prompt_parts.append(
                        f"{lift['exercise']} 1RM: {lift['one_rep_max']}kg.")

    prompt_parts.append(
        "Output valid JSON with plan_name, days array (each with day_name, focus_areas, exercises with name, sets, reps, rest).")

    return " ".join(prompt_parts)


# ============================================================
# Exercise Metadata Database (Images + Descriptions)
# ============================================================

EXERCISE_METADATA = {
    # Chest
    "Bench Press": {"description": "Lie on flat bench, lower barbell to chest, press up explosively. King of upper body exercises.", "image": "/api/exercise-images/bench-press.jpg"},
    "Incline Dumbbell Press": {"description": "Press dumbbells on incline bench (30-45°) to target upper chest. Control the descent.", "image": "/api/exercise-images/incline-dumbbell-press.jpg"},
    "Cable Flyes": {"description": "Stand between cable towers, bring handles together in arc motion. Stretch and squeeze.", "image": "/api/exercise-images/cable-flyes.jpg"},
    "Push-Ups": {"description": "Classic bodyweight exercise. Keep core tight, full range of motion, chest to ground.", "image": "/api/exercise-images/push-ups.jpg"},
    "Flat Db Press": {"description": "Dumbbell bench press on flat bench. Greater range of motion than barbell version.", "image": "/api/exercise-images/dumbbell-bench-press.jpg"},
    "Dumbbell Flyes": {"description": "Lie flat, arc dumbbells out and up. Focus on stretch and chest contraction.", "image": "/api/exercise-images/dumbbell-flyes.jpg"},

    # Back
    "Barbell Rows": {"description": "Hinge at hips, pull barbell to lower chest/upper abs. Keep back straight, squeeze lats.", "image": "/api/exercise-images/barbell-rows.jpg"},
    "Lat Pulldown": {"description": "Pull bar down to upper chest, lean back slightly. Focus on pulling with elbows, not hands.", "image": "/api/exercise-images/lat-pulldown.jpg"},
    "Seated Cable Row": {"description": "Sit upright, pull handle to midsection. Squeeze shoulder blades together at peak.", "image": "/api/exercise-images/seated-cable-row.jpg"},
    "Face Pulls": {"description": "Pull rope to face, elbows high. Excellent for rear delts and posture.", "image": "/api/exercise-images/face-pulls.jpg"},
    "Pull-Ups": {"description": "Hang from bar, pull chin over bar. Use full range of motion, control descent.", "image": "/api/exercise-images/pull-ups.jpg"},
    "Dumbbell Rows": {"description": "One arm at a time, brace on bench. Pull dumbbell to hip, squeeze lat at top.", "image": "/api/exercise-images/dumbbell-rows.jpg"},

    # Shoulders
    "Overhead Press": {"description": "Press barbell from shoulders to overhead. Keep core tight, don't lean back excessively.", "image": "/api/exercise-images/overhead-press.jpg"},
    "Lateral Raises": {"description": "Raise dumbbells to sides until parallel to floor. Lead with elbows, slight bend.", "image": "/api/exercise-images/lateral-raises.jpg"},
    "Front Raises": {"description": "Raise dumbbells forward to shoulder height. Alternate or both together.", "image": "/api/exercise-images/front-raises.jpg"},
    "Rear Delt Flyes": {"description": "Bend forward, raise dumbbells to sides. Target rear deltoids, crucial for shoulder health.", "image": "/api/exercise-images/rear-delt-flyes.jpg"},
    "Dumbbell Shoulder Press": {"description": "Press dumbbells overhead from shoulder position. Greater range than barbell.", "image": "/api/exercise-images/dumbbell-shoulder-press.jpg"},

    # Arms
    "Tricep Pushdown": {"description": "Push cable bar/rope down, extend elbows fully. Keep upper arms stationary.", "image": "/api/exercise-images/tricep-pushdown.jpg"},
    "Overhead Tricep Extension": {"description": "Raise dumbbell overhead, lower behind head. Full stretch, full contraction.", "image": "/api/exercise-images/overhead-tricep-extension.jpg"},
    "Barbell Curls": {"description": "Curl barbell with supinated grip. Don't swing, focus on bicep contraction.", "image": "/api/exercise-images/barbell-curls.jpg"},
    "Hammer Curls": {"description": "Curl dumbbells with neutral grip (thumbs up). Targets brachialis and forearms.", "image": "/api/exercise-images/hammer-curls.jpg"},
    "Dumbbell Curls": {"description": "Classic bicep builder. Curl dumbbells with full supination at top.", "image": "/api/exercise-images/dumbbell-curls.jpg"},

    # Legs
    "Barbell Squat": {"description": "King of leg exercises. Squat deep, drive through heels. Keep chest up, knees out.", "image": "/api/exercise-images/barbell-squat.jpg"},
    "Leg Press": {"description": "Press platform with feet shoulder-width. Control descent, don't lock knees at top.", "image": "/api/exercise-images/leg-press.jpg"},
    "Leg Extension": {"description": "Extend legs against pad. Squeeze quads at top, control the descent.", "image": "/api/exercise-images/leg-extension.jpg"},
    "Romanian Deadlift": {"description": "Hinge at hips, lower bar along shins. Feel hamstring stretch, drive hips forward.", "image": "/api/exercise-images/romanian-deadlift.jpg"},
    "Leg Curl": {"description": "Curl legs against pad. Isolates hamstrings, squeeze at top.", "image": "/api/exercise-images/leg-curl.jpg"},
    "Hip Thrust": {"description": "Thrust hips up with barbell across hips. Best glute builder, squeeze at top.", "image": "/api/exercise-images/hip-thrust.jpg"},
    "Bulgarian Split Squat": {"description": "Rear foot elevated, lunge forward leg. Excellent for glutes and quads.", "image": "/api/exercise-images/bulgarian-split-squat.jpg"},
    "Standing Calf Raises": {"description": "Raise up on toes, lower with control. Full stretch, full contraction.", "image": "/api/exercise-images/standing-calf-raises.jpg"},
    "Goblet Squat": {"description": "Hold dumbbell at chest, squat deep. Great for beginners and mobility.", "image": "/api/exercise-images/goblet-squat.jpg"},
    "Dumbbell Lunges": {"description": "Step forward into lunge, drive back up. Keep torso upright, knee behind toes.", "image": "/api/exercise-images/dumbbell-lunges.jpg"},

    # Core
    "Plank": {"description": "Hold straight line from head to heels. Engage core, don't let hips sag.", "image": "/api/exercise-images/plank.jpg"},
    "Cable Woodchoppers": {"description": "Rotate torso, pull cable diagonally. Great for obliques and rotational power.", "image": "/api/exercise-images/cable-woodchoppers.jpg"},
    "Hanging Leg Raises": {"description": "Hang from bar, raise legs to parallel. Control swing, focus on lower abs.", "image": "/api/exercise-images/hanging-leg-raises.jpg"},

    # Cardio
    "Treadmill HIIT": {"description": "Alternate high intensity sprints with recovery periods. Burns fat, improves conditioning.", "image": "/api/exercise-images/treadmill-hiit.jpg"},

    # Additional exercises
    "Sternal Push-Up": {"description": "Decline push-up variation with chest to ground. Advanced chest exercise.", "image": "/api/exercise-images/sternal-push-up.jpg"},
    "Reverse Pec Deck": {"description": "Face pec deck machine, pull handles back. Isolates rear deltoids.", "image": "/api/exercise-images/reverse-pec-deck.jpg"},
    "Deadlift": {"description": "Lift barbell from ground to standing. Full body power, maintain neutral spine.", "image": "/api/exercise-images/deadlift.jpg"},
}


def enrich_exercise_with_metadata(exercise: dict) -> dict:
    """Add image URL and description to exercise if available in database"""
    name = exercise.get("name", "")
    if name in EXERCISE_METADATA:
        metadata = EXERCISE_METADATA[name]
        exercise["image_url"] = metadata["image"]
        exercise["description"] = metadata["description"]
    else:
        # Fallback for unknown exercises
        exercise["image_url"] = "/api/exercise-images/default-exercise.jpg"
        exercise["description"] = f"Perform {name} with proper form and controlled tempo."
    return exercise


# ============================================================
# generate_fallback_exercises — COMMENTED OUT
# The model output + injury post-processing filter handles
# exercise selection. This function is kept for reference.
# ============================================================
# def generate_fallback_exercises(day_name, focus_areas, fitness_level, available_equipment=None, injuries=None):
#     pass


def extract_workout_from_model_output(text: str, req_days: int = 4, req_goal: str = "Muscle", req_level: str = "Intermediate", req_equipment: List[str] = None) -> Dict[str, Any]:
    """
    Extract workout data from ML model output and build a structured plan.
    Improved version with:
      - Exercise deduplication (no repeated exercises within a day)
      - Smart muscle-group-based exercise distribution
      - Equipment filtering before enrichment
      - Better regex handling for malformed model output
    """
    # ── Step 1: Extract plan-level metadata ──
    plan_name_match = re.search(r'"plan_name":\s*"([^"]+)"', text)
    plan_name = plan_name_match.group(
        1) if plan_name_match else f"AI {req_goal} Plan"

    # ── Step 2: Extract ALL exercises from the raw text ──
    exercises_data = []
    seen_exercises_global = set()  # Deduplicate globally
    exercise_pattern = r'"name":\s*"([^"]+)".*?"sets":\s*"?(\d+)"?.*?"reps":\s*"([^"]+)".*?"rest":\s*"([^"]+)"'

    for match in re.finditer(exercise_pattern, text):
        ex_name = match.group(1).strip()

        # Skip if we've already seen this exercise
        if ex_name.lower() in seen_exercises_global:
            continue
        seen_exercises_global.add(ex_name.lower())

        exercise = {
            "name": ex_name,
            "sets": match.group(2),
            "reps": match.group(3),
            "rest": match.group(4)
        }

        # Extract additional fields from a search window after this exercise
        search_start = match.start()
        next_name_match = text.find('"name":', match.end())
        search_end = next_name_match if next_name_match > 0 else min(
            len(text), match.start() + 500)
        search_window = text[search_start:search_end]

        muscles_match = re.search(
            r'"target_muscles":\s*\[([^\]]+)\]', search_window)
        if muscles_match:
            exercise["target_muscles"] = re.findall(
                r'"([^"]+)"', muscles_match.group(1))

        equipment_match = re.search(r'"equipment":\s*"([^"]+)"', search_window)
        if equipment_match:
            exercise["equipment"] = equipment_match.group(1)

        notes_match = re.search(r'"notes":\s*"([^"]+)"', search_window)
        if notes_match:
            exercise["notes"] = notes_match.group(1)

        movement_match = re.search(
            r'"movement_pattern":\s*"([^"]+)"', search_window)
        if movement_match:
            exercise["movement_pattern"] = movement_match.group(1)

        exercise_type_match = re.search(
            r'"exercise_type":\s*"([^"]+)"', search_window)
        if exercise_type_match:
            exercise["exercise_type"] = exercise_type_match.group(1)

        exercises_data.append(exercise)

    print(
        f"📊 Extracted {len(exercises_data)} unique exercises from model output")

    # ── Step 3: Equipment filter (before enrichment) ──
    if req_equipment:
        equipment_lower = [eq.lower() for eq in req_equipment]
        filtered = []
        for ex in exercises_data:
            ex_eq = ex.get("equipment", "").lower()
            is_bodyweight = "body" in ex_eq and "weight" in ex_eq or ex_eq == "bodyweight"
            if is_bodyweight or not ex_eq or any(eq in ex_eq or ex_eq in eq for eq in equipment_lower):
                filtered.append(ex)
        print(
            f"   🔧 Equipment filter: {len(exercises_data)} → {len(filtered)} exercises")
        exercises_data = filtered

    # ── Step 4: Parse day structures from model output ──
    days_data = []
    day_pattern = r'"day_number":\s*(\d+).*?"day_name":\s*"([^"]+)".*?"focus_areas":\s*\[([^\]]+)\]'
    day_matches = list(re.finditer(day_pattern, text))

    # Define day templates — must match the training split templates
    day_templates = {
        3: [("Push", ["chest", "shoulders", "triceps"]),
            ("Pull", ["back", "biceps", "rear delts"]),
            ("Legs", ["quads", "hamstrings", "glutes", "calves"])],
        4: [("Push", ["chest", "shoulders", "triceps"]),
            ("Pull", ["back", "biceps", "rear delts"]),
            ("Legs", ["quads", "hamstrings", "glutes", "calves"]),
            ("Upper Mix", ["chest", "back", "shoulders"])],
        5: [("Chest", ["chest"]),
            ("Back", ["back", "lats"]),
            ("Shoulders & Arms", ["shoulders", "biceps", "triceps"]),
            ("Legs", ["quads", "hamstrings", "glutes", "calves"]),
            ("Arms & Abs", ["biceps", "triceps", "core"])],
        6: [("Push A", ["chest", "triceps"]), ("Pull A", ["back", "biceps"]),
            ("Legs A", ["quads", "calves"]),
            ("Push B", ["shoulders", "triceps"]),
            ("Pull B", ["back", "rear delts"]),
            ("Legs B", ["hamstrings", "glutes"])]
    }
    templates = day_templates.get(req_days, day_templates[4])

    if day_matches:
        # ── Path A: Model generated day structures ──
        for i, match in enumerate(day_matches):
            day_number = int(match.group(1))
            day_name = match.group(2)
            focus_areas_str = match.group(3)
            focus_areas = re.findall(r'"([^"]+)"', focus_areas_str)

            # Extract the text segment for THIS day only
            start_pos = match.end()
            end_pos = day_matches[i + 1].start() if i + \
                1 < len(day_matches) else len(text)
            day_text = text[start_pos:end_pos]

            # Parse duration if present
            duration_match = re.search(
                r'"estimated_duration_minutes":\s*(\d+)', day_text)
            estimated_duration = int(
                duration_match.group(1)) if duration_match else None

            # Extract exercises for this day (with per-day dedup)
            day_exercises = []
            seen_in_day = set()
            for ex_match in re.finditer(exercise_pattern, day_text):
                ex_name = ex_match.group(1).strip()
                if ex_name.lower() in seen_in_day:
                    continue  # Skip duplicate within this day
                seen_in_day.add(ex_name.lower())

                exercise = {
                    "name": ex_name,
                    "sets": ex_match.group(2),
                    "reps": ex_match.group(3),
                    "rest": ex_match.group(4)
                }

                # Extract additional fields
                ex_start = ex_match.start()
                next_ex = day_text.find('"name":', ex_match.end())
                ex_end = next_ex if next_ex > 0 else len(day_text)
                ex_window = day_text[ex_start:ex_end]

                muscles_match = re.search(
                    r'"target_muscles":\s*\[([^\]]+)\]', ex_window)
                if muscles_match:
                    exercise["target_muscles"] = re.findall(
                        r'"([^"]+)"', muscles_match.group(1))

                equipment_match = re.search(
                    r'"equipment":\s*"([^"]+)"', ex_window)
                if equipment_match:
                    exercise["equipment"] = equipment_match.group(1)

                notes_match = re.search(r'"notes":\s*"([^"]+)"', ex_window)
                if notes_match:
                    exercise["notes"] = notes_match.group(1)

                movement_match = re.search(
                    r'"movement_pattern":\s*"([^"]+)"', ex_window)
                if movement_match:
                    exercise["movement_pattern"] = movement_match.group(1)

                exercise_type_match = re.search(
                    r'"exercise_type":\s*"([^"]+)"', ex_window)
                if exercise_type_match:
                    exercise["exercise_type"] = exercise_type_match.group(1)

                # Equipment filter for per-day exercises
                if req_equipment:
                    ex_eq = exercise.get("equipment", "").lower()
                    is_bw = "body" in ex_eq and "weight" in ex_eq or ex_eq == "bodyweight"
                    if ex_eq and not is_bw and not any(eq in ex_eq or ex_eq in eq for eq in equipment_lower):
                        continue  # Skip exercise that doesn't match equipment

                day_exercises.append(exercise)

            # If per-day parsing found nothing, try to assign from global pool
            if not day_exercises and exercises_data:
                # Match exercises by focus area / muscle group (use full phrases)
                for ex in exercises_data:
                    ex_muscles = " ".join(ex.get("target_muscles", [])).lower()
                    ex_name_lower = ex.get("name", "").lower()
                    combined = f"{ex_muscles} {ex_name_lower}"
                    if any(fa.lower() in combined for fa in focus_areas):
                        if ex["name"].lower() not in seen_in_day:
                            day_exercises.append(ex.copy())
                            seen_in_day.add(ex["name"].lower())
                            if len(day_exercises) >= 5:
                                break

            day_dict = {
                "day_number": day_number,
                "day_name": day_name,
                "focus_areas": focus_areas,
                "focus": ", ".join(focus_areas) if focus_areas else "General",
                "exercises": day_exercises
            }

            if estimated_duration:
                day_dict["estimated_duration_minutes"] = estimated_duration

            days_data.append(day_dict)

        # Fill missing days if model didn't generate enough
        if len(days_data) < req_days:
            print(
                f"⚠️ Model only generated {len(days_data)} days, filling {req_days - len(days_data)} missing days with templates")

            # Collect all exercise names already used
            assigned_names = set()
            for day in days_data:
                for ex in day.get("exercises", []):
                    assigned_names.add(ex.get("name", "").lower())

            # Get unassigned exercises
            unassigned = [ex for ex in exercises_data if ex.get(
                "name", "").lower() not in assigned_names]

            for i in range(len(days_data), req_days):
                template = templates[i % len(templates)]
                focus_lower = " ".join(template[1]).lower()

                # Try to match unassigned exercises by muscle group
                # Use full focus area phrases to avoid "delts" matching "front delts"
                day_exercises = []
                remaining = []
                for ex in unassigned:
                    ex_muscles = " ".join(ex.get("target_muscles", [])).lower()
                    ex_name_lower = ex.get("name", "").lower()
                    combined = f"{ex_muscles} {ex_name_lower}"
                    if any(focus.lower() in combined for focus in template[1]):
                        day_exercises.append(ex.copy())
                    else:
                        remaining.append(ex)
                unassigned = remaining

                # Limit to 5 exercises per day
                day_exercises = day_exercises[:5]

                days_data.append({
                    "day_number": i + 1,
                    "day_name": f"Day {i + 1}: {template[0]}",
                    "focus_areas": template[1],
                    "focus": ", ".join(template[1]),
                    "exercises": day_exercises
                })
    else:
        # ── Path B: No day structures found — distribute exercises by muscle group ──
        print(
            f"📋 No day structures found in model output, distributing {len(exercises_data)} exercises to {req_days} days")

        # Build a muscle-group mapping for smart distribution
        muscle_keywords = {
            "chest": ["chest", "pec", "bench", "fly", "push-up", "pushup"],
            "back": ["back", "lat", "row", "pull-up", "pullup", "pulldown", "chin-up", "chinup"],
            "shoulders": ["shoulder", "delt", "lateral raise", "overhead press"],
            "triceps": ["tricep", "pushdown", "skull", "dip"],
            "biceps": ["bicep", "curl", "hammer curl"],
            "quads": ["quad", "squat", "leg press", "leg extension", "lunge"],
            "hamstrings": ["hamstring", "leg curl", "romanian", "rdl", "deadlift"],
            "glutes": ["glute", "hip thrust", "bridge", "split squat"],
            "core": ["core", "ab", "plank", "crunch", "woodchop"],
            "calves": ["calf", "calves"],
            "cardio": ["cardio", "hiit", "treadmill", "cycling", "running"],
            "rear delts": ["rear delt", "face pull", "reverse fly"],
        }

        for i in range(req_days):
            template = templates[i % len(templates)]
            focus_areas = template[1]
            focus_lower = " ".join(focus_areas).lower()

            # Match exercises to this day's focus areas
            day_exercises = []
            remaining_exercises = []
            for ex in exercises_data:
                ex_name_lower = ex.get("name", "").lower()
                ex_muscles = " ".join(ex.get("target_muscles", [])).lower()
                combined = f"{ex_name_lower} {ex_muscles}"

                matched = False
                for focus in focus_areas:
                    keywords = muscle_keywords.get(
                        focus.lower(), [focus.lower()])
                    if any(kw in combined for kw in keywords):
                        matched = True
                        break

                if matched:
                    day_exercises.append(ex)
                else:
                    remaining_exercises.append(ex)

            exercises_data = remaining_exercises  # Remove assigned exercises for next day
            day_exercises = day_exercises[:6]  # Max 6 per day

            days_data.append({
                "day_number": i + 1,
                "day_name": f"Day {i + 1}: {template[0]}",
                "focus_areas": focus_areas,
                "focus": ", ".join(focus_areas),
                "exercises": day_exercises
            })

        # Distribute remaining unmatched exercises ONLY to matching focus days
        # (never blindly dump to smallest day — that causes cross-contamination)
        for ex in exercises_data:
            ex_name_lower = ex.get("name", "").lower()
            ex_muscles = " ".join(ex.get("target_muscles", [])).lower()
            combined_remaining = f"{ex_name_lower} {ex_muscles}"
            placed = False
            for day_candidate in sorted(days_data, key=lambda d: len(d["exercises"])):
                if len(day_candidate["exercises"]) >= 6:
                    continue
                for focus in day_candidate.get("focus_areas", []):
                    keywords = muscle_keywords.get(
                        focus.lower(), [focus.lower()])
                    if any(kw in combined_remaining for kw in keywords):
                        day_candidate["exercises"].append(ex)
                        placed = True
                        break
                if placed:
                    break
            # If no matching day found, skip the exercise (don't cross-contaminate)

    # ── Step 5: Enrich all exercises with metadata (images + descriptions) ──
    for day in days_data:
        day["exercises"] = [enrich_exercise_with_metadata(
            ex) for ex in day.get("exercises", [])]

    # ── Step 6: Build final plan object ──
    plan = {
        "plan_name": plan_name,
        "fitness_level": req_level,
        "goal": req_goal,
        "days_per_week": req_days,
        "program_duration_weeks": 8,
        "days": days_data
    }

    duration_match = re.search(r'"program_duration_weeks":\s*(\d+)', text)
    if duration_match:
        plan["program_duration_weeks"] = int(duration_match.group(1))

    notes_match = re.search(r'"notes":\s*"([^"]+)"', text)
    if notes_match:
        plan["notes"] = notes_match.group(1)
    else:
        plan["notes"] = "Generated by AI with user context"

    prog_overload_match = re.search(
        r'"progressive_overload":\s*\{([^}]+)\}', text)
    if prog_overload_match:
        prog_obj = {}
        prog_content = prog_overload_match.group(1)

        prog_type_match = re.search(r'"type":\s*"([^"]+)"', prog_content)
        if prog_type_match:
            prog_obj["type"] = prog_type_match.group(1)

        prog_progression_match = re.search(
            r'"progression":\s*"([^"]+)"', prog_content)
        if prog_progression_match:
            prog_obj["progression"] = prog_progression_match.group(1)

        prog_deload_match = re.search(r'"deload":\s*"([^"]+)"', prog_content)
        if prog_deload_match:
            prog_obj["deload"] = prog_deload_match.group(1)

        if prog_obj:
            plan["progressive_overload"] = prog_obj

    return plan


# ── Load exercise database (IntelliFit AI-Ready CSV — much better data quality) ──
EXERCISE_CSV_PATH = os.path.join(
    SCRIPT_DIR, "data", "IntelliFit_AI_Ready_8000_Exercises.csv")
EXERCISE_DB: List[Dict[str, Any]] = []
try:
    import csv as _csv
    with open(EXERCISE_CSV_PATH, "r", encoding="utf-8") as _f:
        reader = _csv.DictReader(_f)
        for row in reader:
            # Normalise CSV fields to the list-based format the rest of the code expects
            exercise = {
                "name": row.get("name", "").strip(),
                "targetMuscles": [row["targetMuscles"].strip()] if row.get("targetMuscles", "").strip() else [],
                "bodyParts": [row["bodyParts"].strip()] if row.get("bodyParts", "").strip() else [],
                "equipments": [row["equipments"].strip()] if row.get("equipments", "").strip() else ["body weight"],
                "secondaryMuscles": [m.strip() for m in row.get("secondaryMuscles", "").split("|") if m.strip()],
                "instructions": row.get("instructions", ""),
                "movement_pattern": row.get("movement_pattern", "general").strip(),
                "difficulty_level": {"beginner": 1, "intermediate": 2, "advanced": 3}.get(
                    row.get("difficulty_level", "intermediate").strip().lower(), 2),
                "exercise_type": row.get("exercise_type", "compound").strip(),
                "rep_ranges_by_goal": {
                    "Strength": {"min_reps": 3, "max_reps": 6, "rest_seconds": 180, "sets": 4},
                    "Power": {"min_reps": 1, "max_reps": 5, "rest_seconds": 240, "sets": 3},
                    "Muscle": {
                        "min_reps": int(row.get("recommended_rep_min", 8)),
                        "max_reps": int(row.get("recommended_rep_max", 12)),
                        "rest_seconds": int(row.get("rest_seconds", 90)),
                        "sets": 3,
                    },
                    "WeightLoss": {"min_reps": 12, "max_reps": 15, "rest_seconds": 60, "sets": 3},
                    "Endurance": {"min_reps": 15, "max_reps": 20, "rest_seconds": 45, "sets": 3},
                },
                "goal_suitability": {},  # will be inferred from exercise_type
                "unilateral": row.get("unilateral", "False").strip().lower() == "true",
            }
            # Infer goal suitability from exercise type
            if exercise["exercise_type"] == "compound":
                exercise["goal_suitability"] = {
                    "Strength": 8, "Muscle": 8, "WeightLoss": 7, "Endurance": 5, "Power": 8}
            else:
                exercise["goal_suitability"] = {
                    "Strength": 5, "Muscle": 7, "WeightLoss": 6, "Endurance": 6, "Power": 4}
            EXERCISE_DB.append(exercise)
    print(
        f"✅ Loaded {len(EXERCISE_DB)} exercises from IntelliFit CSV database")
except Exception as _e:
    print(f"⚠️ Could not load exercise CSV: {_e}")
    # Fallback: try old JSON
    _json_path = os.path.join(
        SCRIPT_DIR, "data", "exercises_comprehensive_real.json")
    try:
        with open(_json_path, "r", encoding="utf-8") as _f:
            EXERCISE_DB = json.load(_f)
        print(
            f"✅ Fallback: Loaded {len(EXERCISE_DB)} exercises from JSON database")
    except Exception as _e2:
        print(f"⚠️ Could not load any exercise DB: {_e2}")

# Organise DB by movement pattern & muscle for fast lookup
DB_BY_PATTERN: Dict[str, List[Dict]] = {}
DB_BY_MUSCLE: Dict[str, List[Dict]] = {}
DB_BY_NAME: Dict[str, Dict] = {}   # name → exercise (for fast validation)
for _ex in EXERCISE_DB:
    _pat = _ex.get("movement_pattern", "other")
    DB_BY_PATTERN.setdefault(_pat, []).append(_ex)
    for _m in _ex.get("targetMuscles", []):
        DB_BY_MUSCLE.setdefault(_m.lower(), []).append(_ex)
    _nm = _ex.get("name", "").lower().strip()
    if _nm:
        DB_BY_NAME[_nm] = _ex


def _pick_exercises_for_focus(focus_areas: List[str], goal: str, level: str,
                              n: int = 5, exclude: set = None,
                              equipment: List[str] = None) -> List[Dict[str, Any]]:
    """
    Pick *n* exercises from the SAME database the model was trained on,
    matching the given focus areas.  This ensures quality and variety
    even when the small model truncates its output.
    """
    import random as _rand
    exclude = exclude or set()
    goal_key = goal if goal in ["Strength", "Muscle",
                                "WeightLoss", "Endurance", "Power"] else "Muscle"

    # Expanded keyword map: focus area → possible targetMuscle/bodyPart/pattern matches
    # Updated for IntelliFit CSV format (targetMuscles: "pectorals", "delts", etc.)
    FOCUS_KEYWORDS: Dict[str, List[str]] = {
        "chest": ["chest", "pectoral"],
        "shoulders": ["shoulder", "delt"],
        "triceps": ["tricep"],
        "back": ["back", "lat", "rhomboid", "trap", "spine"],
        "biceps": ["bicep"],
        "quads": ["quad"],
        "hamstrings": ["hamstring"],
        "glutes": ["glute"],
        "core": ["abs", "abdomin", "oblique", "core", "waist"],
        "calves": ["calf", "calves", "soleus", "gastrocnemius", "lower legs"],
        "rear delts": ["rear delt", "posterior delt", "upper back"],
        "cardio": ["cardio", "cardiovascular"],
        "legs": ["quad", "hamstring", "glute", "calf", "upper legs", "lower legs", "adductor", "abductor"],
        "front delts": ["front delt", "anterior delt", "delt"],
        "forearms": ["forearm", "lower arms", "wrist"],
        "lats": ["lat"],
    }

    # Movement pattern exclusion: prevent push exercises on pull days, etc.
    PUSH_FOCUSES = {"chest", "shoulders", "triceps", "front delts"}
    PULL_FOCUSES = {"back", "biceps", "rear delts", "lats"}
    LEG_FOCUSES = {"quads", "hamstrings", "glutes", "calves", "legs"}
    focus_set = {f.lower() for f in focus_areas}

    excluded_patterns = set()
    # Also track which bodyParts are NOT allowed (prevents cross-contamination)
    excluded_body_parts = set()
    # Target muscle exclusion sets (catches mislabeled exercises in CSV)
    LEG_TARGET_MUSCLES_PICK = {"glutes", "quads",
                               "hamstrings", "calves", "adductors", "abductors"}
    UPPER_PUSH_TARGET_MUSCLES_PICK = {
        "pectorals", "delts", "triceps", "serratus anterior"}
    UPPER_PULL_TARGET_MUSCLES_PICK = {
        "lats", "traps", "upper back", "biceps", "forearms", "levator scapulae", "spine"}

    excluded_target_muscles = set()
    if focus_set & PULL_FOCUSES and not (focus_set & PUSH_FOCUSES) and not (focus_set & LEG_FOCUSES):
        # Pull day: no push, no leg/hip exercises
        excluded_patterns = {"push", "elbow_extension", "horizontal_push",
                             "vertical_push", "squat", "lunge", "hinge",
                             "plyometric"}
        excluded_body_parts = {"upper legs", "lower legs"}
        excluded_target_muscles = LEG_TARGET_MUSCLES_PICK
    elif focus_set & PUSH_FOCUSES and not (focus_set & PULL_FOCUSES) and not (focus_set & LEG_FOCUSES):
        # Push day: no pull, no leg/hip exercises
        excluded_patterns = {"pull", "elbow_flexion", "horizontal_pull",
                             "vertical_pull", "squat", "lunge", "hinge",
                             "plyometric"}
        excluded_body_parts = {"upper legs", "lower legs"}
        excluded_target_muscles = LEG_TARGET_MUSCLES_PICK
    elif focus_set & LEG_FOCUSES and not (focus_set & (PUSH_FOCUSES | PULL_FOCUSES)):
        # Leg day: no upper body exercises
        excluded_patterns = {"horizontal_push", "vertical_push", "horizontal_pull",
                             "vertical_pull", "elbow_extension", "elbow_flexion"}
        excluded_target_muscles = UPPER_PUSH_TARGET_MUSCLES_PICK | UPPER_PULL_TARGET_MUSCLES_PICK

    # Equipment normalization for matching
    user_equipment = set()
    if equipment:
        for eq in equipment:
            eq_low = eq.lower().strip()
            user_equipment.add(eq_low)
            # Also add common aliases
            if "dumbbell" in eq_low:
                user_equipment.add("dumbbell")
            if "barbell" in eq_low:
                user_equipment.add("barbell")
            if "cable" in eq_low:
                user_equipment.add("cable")
            if "machine" in eq_low:
                user_equipment.update(
                    {"machine", "leverage machine", "smith machine"})
    user_equipment.add("body weight")  # always available

    # Match by bodyParts + targetMuscles + movement_pattern
    candidates: List[Dict] = []
    for focus in focus_areas:
        focus_lower = focus.lower()
        keywords = FOCUS_KEYWORDS.get(focus_lower, [focus_lower])

        for ex in EXERCISE_DB:
            # Skip exercises with empty/placeholder targetMuscles (bad data)
            target_muscles = ex.get("targetMuscles", [])
            real_muscles = [m for m in target_muscles if m and m.strip()]
            if not real_muscles:
                continue

            # Skip generic/full-body exercises (too unspecific for focused days)
            body_parts = ex.get("bodyParts", [])
            if any(bp.lower() in ("full body", "other", "cardio") for bp in body_parts):
                continue

            # Skip exercises with conflicting movement patterns
            ex_pattern = ex.get("movement_pattern", "").lower()
            if excluded_patterns and any(excl in ex_pattern for excl in excluded_patterns):
                continue

            # Skip exercises whose bodyParts are in the excluded set
            # (e.g., "upper legs" exercises should not appear on push/pull days)
            if excluded_body_parts and any(bp.lower() in excluded_body_parts for bp in body_parts):
                continue

            # Skip exercises whose targetMuscles are in the excluded set
            # (catches mislabeled exercises, e.g. glutes with bodyParts="back")
            if excluded_target_muscles and any(m.lower().strip() in excluded_target_muscles for m in real_muscles):
                continue

            # Check if exercise matches the focus area
            # NOTE: We intentionally do NOT include secondaryMuscles here
            # because "lower back" secondary muscles cause glute/hamstring
            # exercises to falsely match "back" focus on Pull days.
            combined_text = " ".join([
                " ".join(real_muscles),
                " ".join(body_parts),
                ex_pattern,
            ]).lower()

            if any(kw in combined_text for kw in keywords):
                candidates.append(ex)

    # De-dup & exclude already-used (also prevent similar names like "X" and "X V. 2")
    import re as _re

    def _base_name(n: str) -> str:
        """Normalize name for dedup: lowercase, strip version suffixes."""
        n = n.lower().strip()
        n = _re.sub(r'\s*v\.?\s*\d+\s*$', '', n)  # Strip "V. 2", "v2" etc.
        # Strip trailing parenthesized
        n = _re.sub(r'\s*\(.*?\)\s*$', '', n)
        return n.strip()

    seen = set()
    unique: List[Dict] = []
    for ex in candidates:
        base = _base_name(ex["name"])
        if base not in seen and ex["name"].lower() not in exclude:
            seen.add(base)
            unique.append(ex)

    # Filter by difficulty for beginners
    if level.lower() == "beginner":
        filtered = [ex for ex in unique if ex.get("difficulty_level", 3) <= 3]
        unique = filtered if filtered else unique

    # Prioritize exercises that match user's equipment
    if user_equipment:
        equip_match = []
        equip_other = []
        for ex in unique:
            ex_equips = [e.lower()
                         for e in ex.get("equipments", ["body weight"])]
            # Check if this exercise uses any of the user's equipment
            has_match = any(
                ueq in ex_eq or ex_eq in ueq
                for ex_eq in ex_equips
                for ueq in user_equipment
            )
            if has_match:
                equip_match.append(ex)
            else:
                equip_other.append(ex)
        # Use equipment-matched first, then fall back to others
        unique = equip_match + equip_other

    # Sort by goal suitability (descending) then by compound-first
    def _score(ex):
        goal_score = ex.get("goal_suitability", {}).get(goal_key, 5)
        compound_bonus = 3 if ex.get("exercise_type") == "compound" else 0
        # Equipment match bonus: prefer exercises using user's equipment
        if user_equipment:
            ex_equips = [e.lower()
                         for e in ex.get("equipments", ["body weight"])]
            has_equip = any(
                ueq in ex_eq or ex_eq in ueq
                for ex_eq in ex_equips
                for ueq in user_equipment
                if ueq != "body weight"  # don't bonus body weight specifically
            )
            equip_bonus = 2 if has_equip else 0
        else:
            equip_bonus = 0
        return goal_score + compound_bonus + equip_bonus
    unique.sort(key=_score, reverse=True)

    # Add some variety: pick top candidates but shuffle a bit
    pool = unique[:max(n * 3, 15)]
    if len(pool) > n:
        # Keep the top 2, shuffle the rest
        top = pool[:2]
        rest = pool[2:]
        _rand.shuffle(rest)
        pool = top + rest

    selected = pool[:n]

    # Format them the same way the model does
    formatted: List[Dict[str, Any]] = []
    for ex in selected:
        rep_config = ex.get("rep_ranges_by_goal", {}).get(goal_key, {
            "min_reps": 8, "max_reps": 12, "rest_seconds": 90, "sets": 3
        })
        formatted.append({
            "name": ex["name"].title(),
            "sets": str(rep_config.get("sets", 3)),
            "reps": f"{rep_config['min_reps']}-{rep_config['max_reps']}",
            "rest": f"{rep_config['rest_seconds']} sec",
            "target_muscles": ex.get("targetMuscles", [])[:3],
            "equipment": ex.get("equipments", ["body weight"])[0] if ex.get("equipments") else "body weight",
            "movement_pattern": ex.get("movement_pattern", "other"),
            "exercise_type": ex.get("exercise_type", "isolation"),
            "notes": "Selected from exercise database",
        })
    return formatted


def _generate_plan_sync(prompt: str) -> str:
    """Run one synchronous model generation call (matches training format)."""
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        max_length=256,
        truncation=True,
        padding=True,
    ).to(device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=1024,       # match training MAX_OUTPUT_LENGTH
            num_beams=2,           # faster than 4 beams, still good quality
            early_stopping=True,
            do_sample=False,
        )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)


async def generate_workout_plan_direct(
    prompt: str,
    req_days: int,
    req_goal: str,
    req_level: str,
    req_equipment: List[str] = None,
    req_injuries: List[str] = None,
) -> tuple[Dict[str, Any] | None, bool, str | None]:
    """
    Generate a workout plan with a SINGLE model call (matches training format)
    then fill any underpopulated days from the exercise database.

    Why single call?  The model was trained on full-plan prompts like
    "Generate a 4-day workout plan for intermediate lifter, goal is muscle..."
    and per-day prompts produce garbage because they don't match training data.

    flan-t5-small truncates at ~2200 chars (≈Day 1 + partial Day 2), so we
    complete remaining days from the same 8 000-exercise database the model
    was trained on — ensuring consistency and quality.
    """
    print(f"\n🏋️ Generating {req_days}-day {req_goal} plan ({req_level})...")
    print(f"   Prompt: {prompt[:200]}...")

    # ── Step 1: Single model call (matches training format) ──
    try:
        loop = asyncio.get_event_loop()
        raw_output = await loop.run_in_executor(None, _generate_plan_sync, prompt)
        print(f"   📄 Model output: {len(raw_output)} chars")
        print(f"   Preview: {raw_output[:300]}")
    except Exception as e:
        print(f"   ❌ Model generation error: {e}")
        return None, False, f"Model generation failed: {e}"

    # ── Step 2: Parse model output with existing robust parser ──
    plan = extract_workout_from_model_output(
        raw_output, req_days=req_days, req_goal=req_goal,
        req_level=req_level, req_equipment=req_equipment
    )

    # ── Step 2b: Validate exercises match their day's focus areas ──
    # Uses EXERCISE_DB for reliable muscle data instead of trusting model output.
    # The model (flan-t5-small) often omits target_muscles/movement_pattern,
    # so we look up each exercise by name in the DB.
    FOCUS_MUSCLE_MAP = {
        "chest": ["chest", "pec", "pectoral"],
        "shoulders": ["shoulder", "delt"],
        "triceps": ["tricep"],
        "back": ["back", "lat", "rhomboid", "trapez", "upper back", "spine"],
        "biceps": ["bicep", "brachialis"],
        "rear delts": ["rear delt", "posterior delt", "upper back"],
        "quads": ["quad"],
        "hamstrings": ["hamstring"],
        "glutes": ["glute"],
        "calves": ["calf", "calves", "soleus", "gastrocnemius", "lower legs"],
        "core": ["abs", "abdomin", "oblique", "core", "waist"],
        "lats": ["lat", "latissimus"],
        "legs": ["quad", "hamstring", "glute", "calf", "upper legs", "lower legs",
                 "adductor", "abductor"],
        "front delts": ["front delt", "anterior delt", "delt"],
        "forearms": ["forearm", "lower arms", "wrist"],
    }

    # Movement pattern sets for cross-contamination prevention
    V_PUSH_FOCUSES = {"chest", "shoulders", "triceps", "front delts"}
    V_PULL_FOCUSES = {"back", "biceps", "rear delts", "lats"}
    V_LEG_FOCUSES = {"quads", "hamstrings", "glutes", "calves", "legs"}

    # Target muscle sets for cross-contamination prevention
    # These catch mislabeled exercises (e.g. glute exercises with bodyParts="back")
    LEG_TARGET_MUSCLES = {"glutes", "quads",
                          "hamstrings", "calves", "adductors", "abductors"}
    UPPER_PUSH_TARGET_MUSCLES = {"pectorals",
                                 "delts", "triceps", "serratus anterior"}
    UPPER_PULL_TARGET_MUSCLES = {
        "lats", "traps", "upper back", "biceps", "forearms", "levator scapulae", "spine"}

    for day in plan.get("days", []):
        focus_areas = day.get("focus_areas", [])
        if not focus_areas:
            continue
        focus_set = {fa.lower() for fa in focus_areas}

        # Build set of allowed keywords for this day
        allowed = set()
        for fa in focus_areas:
            for kw in FOCUS_MUSCLE_MAP.get(fa.lower(), [fa.lower()]):
                allowed.add(kw)

        # Determine excluded movement patterns, body parts, AND target muscles
        excluded_patterns = set()
        excluded_body_parts = set()
        excluded_target_muscles = set()
        if focus_set & V_PULL_FOCUSES and not (focus_set & V_PUSH_FOCUSES) and not (focus_set & V_LEG_FOCUSES):
            excluded_patterns = {"push", "elbow_extension", "horizontal_push",
                                 "vertical_push", "squat", "lunge", "hinge",
                                 "plyometric"}
            excluded_body_parts = {"upper legs", "lower legs"}
            excluded_target_muscles = LEG_TARGET_MUSCLES
        elif focus_set & V_PUSH_FOCUSES and not (focus_set & V_PULL_FOCUSES) and not (focus_set & V_LEG_FOCUSES):
            excluded_patterns = {"pull", "elbow_flexion", "horizontal_pull",
                                 "vertical_pull", "squat", "lunge", "hinge",
                                 "plyometric"}
            excluded_body_parts = {"upper legs", "lower legs"}
            excluded_target_muscles = LEG_TARGET_MUSCLES
        elif focus_set & V_LEG_FOCUSES and not (focus_set & (V_PUSH_FOCUSES | V_PULL_FOCUSES)):
            excluded_patterns = {"horizontal_push", "vertical_push", "horizontal_pull",
                                 "vertical_pull", "elbow_extension", "elbow_flexion"}
            excluded_target_muscles = UPPER_PUSH_TARGET_MUSCLES | UPPER_PULL_TARGET_MUSCLES

        # Check each exercise
        validated = []
        for ex in day.get("exercises", []):
            ex_name = ex.get("name", "").strip()
            ex_name_lower = ex_name.lower()

            # Try to look up exercise in DB for reliable data
            db_entry = DB_BY_NAME.get(ex_name_lower)
            if not db_entry:
                # Try partial/fuzzy match (model may generate slightly different names)
                for db_nm, db_ex in DB_BY_NAME.items():
                    if (ex_name_lower in db_nm or db_nm in ex_name_lower) and len(min(ex_name_lower, db_nm, key=len)) > 5:
                        db_entry = db_ex
                        break

            if db_entry:
                # Use DB data for validation (most reliable)
                real_muscles = " ".join(
                    db_entry.get("targetMuscles", [])).lower()
                body_parts_str = " ".join(
                    db_entry.get("bodyParts", [])).lower()
                ex_pattern = db_entry.get("movement_pattern", "").lower()
                combined = f"{real_muscles} {body_parts_str} {ex_pattern}"

                # Check movement pattern exclusion
                if excluded_patterns and any(excl in ex_pattern for excl in excluded_patterns):
                    print(
                        f"   ⚠️ Removed '{ex_name}' from '{day.get('day_name')}' (movement pattern conflict: {ex_pattern})")
                    continue
                # Check body part exclusion
                if excluded_body_parts and any(bp in excluded_body_parts for bp in [b.lower() for b in db_entry.get("bodyParts", [])]):
                    print(
                        f"   ⚠️ Removed '{ex_name}' from '{day.get('day_name')}' (body part '{body_parts_str}' excluded for this day)")
                    continue
                # Check target muscle exclusion (catches mislabeled exercises)
                if excluded_target_muscles:
                    ex_target_muscles = {m.lower().strip()
                                         for m in db_entry.get("targetMuscles", [])}
                    if ex_target_muscles & excluded_target_muscles:
                        print(
                            f"   ⚠️ Removed '{ex_name}' from '{day.get('day_name')}' (target muscle {ex_target_muscles & excluded_target_muscles} excluded for this day)")
                        continue
            else:
                # Fallback: use model-parsed data (less reliable)
                muscles_text = " ".join(ex.get("target_muscles", [])).lower()
                movement = ex.get("movement_pattern", "").lower()
                combined = f"{muscles_text} {movement}"

                # Even with model data, check target muscle exclusion
                if excluded_target_muscles:
                    ex_muscles_set = {m.lower().strip()
                                      for m in ex.get("target_muscles", [])}
                    if ex_muscles_set & excluded_target_muscles:
                        print(
                            f"   ⚠️ Removed '{ex_name}' from '{day.get('day_name')}' (model target muscle excluded for this day)")
                        continue

            # Keep exercise if ANY of its muscles match the day's focus
            if any(kw in combined for kw in allowed):
                validated.append(ex)
            else:
                print(
                    f"   ⚠️ Removed '{ex_name}' from '{day.get('day_name')}' (muscles don't match focus: {combined[:80]})")
        day["exercises"] = validated

    # ── Step 3: Fill underpopulated days from exercise database ──
    # The model typically generates Day 1 fully + partial Day 2 before
    # flan-t5-small truncates.  We fill remaining days from the SAME
    # exercise database the model was trained on (8 000+ real exercises).
    all_used_names: set = set()
    for day in plan.get("days", []):
        for ex in day.get("exercises", []):
            all_used_names.add(ex.get("name", "").lower())

    MIN_EXERCISES = 4
    for day in plan.get("days", []):
        current_count = len(day.get("exercises", []))
        if current_count < MIN_EXERCISES:
            needed = 5 - current_count  # target 5 per day
            focus_areas = day.get("focus_areas", ["chest"])
            print(
                f"   📋 Day '{day.get('day_name', '')}' has {current_count} exercises — filling {needed} from exercise DB")

            db_exercises = _pick_exercises_for_focus(
                focus_areas, req_goal, req_level, n=needed, exclude=all_used_names,
                equipment=req_equipment
            )
            for ex in db_exercises:
                ex = enrich_exercise_with_metadata(ex)
                day["exercises"].append(ex)
                all_used_names.add(ex.get("name", "").lower())

            print(f"   ✅ Day now has {len(day['exercises'])} exercises")

    total_exercises = sum(len(d.get("exercises", []))
                          for d in plan.get("days", []))
    print(
        f"\n✅ Full plan assembled: {total_exercises} exercises across {len(plan.get('days', []))} days")

    if total_exercises == 0:
        return None, False, "Model failed to generate exercises"

    return plan, True, None


# ==============================================================
# Injury-Aware Exercise Filtering (Post-Processing)
# ==============================================================

# Keywords in exercise names that are UNSAFE for each injury type.
# These are matched case-insensitively against the exercise "name" field.
INJURY_EXERCISE_BLACKLIST: Dict[str, List[str]] = {
    "Lower Back": [
        "deadlift", "romanian deadlift", "stiff leg deadlift", "good morning",
        "barbell row", "bent over row", "t-bar row", "pendlay row",
        "back squat", "barbell squat", "front squat",
        "clean", "snatch", "hyperextension", "back extension",
        "sit-up", "situp", "crunch",
        "kettlebell swing",
    ],
    "Shoulder": [
        "overhead press", "military press", "shoulder press",
        "arnold press", "push press", "behind the neck",
        "upright row", "lateral raise", "front raise",
        "face pull", "dumbbell fly", "chest fly",
        "bench press", "incline press", "dip", "handstand",
        "snatch", "clean and press",
    ],
    "Knee": [
        "squat", "back squat", "front squat", "goblet squat",
        "leg press", "lunge", "walking lunge", "reverse lunge",
        "bulgarian split squat", "split squat",
        "leg extension", "box jump", "jump squat",
        "pistol squat", "step up", "step-up",
        "hack squat", "sissy squat",
        "running", "sprint",
    ],
    "Wrist": [
        "barbell curl", "wrist curl", "reverse curl",
        "clean", "snatch", "front squat",
        "push-up", "pushup", "push up",
        "handstand", "planche",
        "bench press", "overhead press",
        "farmer walk", "farmer carry",
        "kettlebell", "dumbbell snatch",
    ],
    "Elbow": [
        "skull crusher", "skullcrusher", "french press",
        "tricep extension", "triceps extension", "overhead extension",
        "close grip bench", "close-grip bench",
        "preacher curl", "concentration curl",
        "barbell curl", "dip",
        "chin-up", "chin up",
        "pull-up", "pullup",
    ],
    "Hip": [
        "squat", "back squat", "front squat",
        "deadlift", "sumo deadlift", "romanian deadlift",
        "lunge", "walking lunge", "hip thrust",
        "bulgarian split squat", "leg press",
        "step up", "step-up",
        "good morning", "kettlebell swing",
        "running", "sprint", "box jump",
    ],
    "Ankle": [
        "squat", "back squat", "front squat", "goblet squat",
        "lunge", "walking lunge", "reverse lunge",
        "calf raise", "standing calf raise", "seated calf raise",
        "box jump", "jump squat", "jump rope",
        "running", "sprint", "burpee",
        "step up", "step-up",
        "pistol squat",
    ],
}

# For each injury, safe replacement exercises grouped by focus area.
INJURY_SAFE_REPLACEMENTS: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    "Lower Back": {
        "back": [
            {"name": "Lat Pulldown", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["lats", "back"], "equipment": "Cable Machine"},
            {"name": "Seated Cable Row", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["back", "rhomboids"], "equipment": "Cable Machine"},
            {"name": "Chest Supported Dumbbell Row", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["back", "lats"], "equipment": "Dumbbells"},
            {"name": "Straight Arm Pulldown", "sets": "3", "reps": "12-15", "rest": "45s",
             "target_muscles": ["lats"], "equipment": "Cable Machine"},
        ],
        "legs": [
            {"name": "Leg Press (Controlled)", "sets": "3", "reps": "10-12", "rest": "90s",
             "target_muscles": ["quads", "glutes"], "equipment": "Machine"},
            {"name": "Leg Curl", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["hamstrings"], "equipment": "Machine"},
            {"name": "Leg Extension", "sets": "3", "reps": "12-15", "rest": "60s",
             "target_muscles": ["quads"], "equipment": "Machine"},
            {"name": "Wall Sit", "sets": "3", "reps": "30-45s hold", "rest": "60s",
             "target_muscles": ["quads"], "equipment": "Bodyweight"},
        ],
        "core": [
            {"name": "Dead Bug", "sets": "3", "reps": "10 each side", "rest": "45s",
             "target_muscles": ["core"], "equipment": "Bodyweight"},
            {"name": "Bird Dog", "sets": "3", "reps": "10 each side", "rest": "45s",
             "target_muscles": ["core", "lower back"], "equipment": "Bodyweight"},
            {"name": "Pallof Press", "sets": "3", "reps": "12 each side", "rest": "45s",
             "target_muscles": ["core", "obliques"], "equipment": "Cable Machine"},
        ],
    },
    "Shoulder": {
        "chest": [
            {"name": "Cable Crossover (Low-to-High)", "sets": "3", "reps": "12-15", "rest": "60s",
             "target_muscles": ["chest"], "equipment": "Cable Machine"},
            {"name": "Floor Press", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["chest", "triceps"], "equipment": "Dumbbells"},
            {"name": "Svend Press", "sets": "3", "reps": "12-15", "rest": "45s",
             "target_muscles": ["chest"], "equipment": "Dumbbells"},
        ],
        "shoulders": [
            {"name": "Band Pull-Apart", "sets": "3", "reps": "15-20", "rest": "45s",
             "target_muscles": ["rear delts", "upper back"], "equipment": "Resistance Bands"},
            {"name": "Cable External Rotation", "sets": "3", "reps": "12-15", "rest": "45s",
             "target_muscles": ["rotator cuff"], "equipment": "Cable Machine"},
            {"name": "Scapular Wall Slides", "sets": "3", "reps": "12-15", "rest": "45s",
             "target_muscles": ["shoulder stabilizers"], "equipment": "Bodyweight"},
        ],
        "back": [
            {"name": "Lat Pulldown (Neutral Grip)", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["lats"], "equipment": "Cable Machine"},
            {"name": "Seated Cable Row", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["back"], "equipment": "Cable Machine"},
        ],
    },
    "Knee": {
        "legs": [
            {"name": "Leg Curl (Hamstrings)", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["hamstrings"], "equipment": "Machine"},
            {"name": "Glute Bridge", "sets": "3", "reps": "12-15", "rest": "60s",
             "target_muscles": ["glutes"], "equipment": "Bodyweight"},
            {"name": "Hip Thrust", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["glutes"], "equipment": "Barbell"},
            {"name": "Seated Calf Raise", "sets": "3", "reps": "15-20", "rest": "45s",
             "target_muscles": ["calves"], "equipment": "Machine"},
            {"name": "Lying Leg Curl", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["hamstrings"], "equipment": "Machine"},
        ],
        "cardio": [
            {"name": "Seated Cycling (Low Resistance)", "sets": "1", "reps": "15-20 min", "rest": "none",
             "target_muscles": ["cardiovascular"], "equipment": "Machine"},
            {"name": "Swimming", "sets": "1", "reps": "20 min", "rest": "none",
             "target_muscles": ["full body"], "equipment": "Pool"},
            {"name": "Upper Body Ergometer", "sets": "1", "reps": "15 min", "rest": "none",
             "target_muscles": ["cardiovascular"], "equipment": "Machine"},
        ],
    },
    "Wrist": {
        "chest": [
            {"name": "Machine Chest Press", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["chest", "triceps"], "equipment": "Machine"},
            {"name": "Pec Deck Machine", "sets": "3", "reps": "12-15", "rest": "60s",
             "target_muscles": ["chest"], "equipment": "Machine"},
        ],
        "arms": [
            {"name": "Cable Bicep Curl (Straight Bar)", "sets": "3", "reps": "12-15", "rest": "45s",
             "target_muscles": ["biceps"], "equipment": "Cable Machine"},
            {"name": "Cable Tricep Pushdown (Rope)", "sets": "3", "reps": "12-15", "rest": "45s",
             "target_muscles": ["triceps"], "equipment": "Cable Machine"},
            {"name": "Hammer Curl (Neutral Grip)", "sets": "3", "reps": "10-12", "rest": "45s",
             "target_muscles": ["biceps", "forearms"], "equipment": "Dumbbells"},
        ],
        "back": [
            {"name": "Lat Pulldown (Wide Grip)", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["lats"], "equipment": "Cable Machine"},
            {"name": "Machine Row", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["back"], "equipment": "Machine"},
        ],
    },
    "Elbow": {
        "arms": [
            {"name": "Cable Bicep Curl (EZ Bar)", "sets": "3", "reps": "12-15", "rest": "45s",
             "target_muscles": ["biceps"], "equipment": "Cable Machine"},
            {"name": "Resistance Band Tricep Extension", "sets": "3", "reps": "15-20", "rest": "45s",
             "target_muscles": ["triceps"], "equipment": "Resistance Bands"},
        ],
        "back": [
            {"name": "Lat Pulldown (Wide Grip)", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["lats"], "equipment": "Cable Machine"},
            {"name": "Seated Cable Row (Neutral Grip)", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["back"], "equipment": "Cable Machine"},
            {"name": "Chest Supported Row", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["back", "lats"], "equipment": "Dumbbells"},
        ],
        "chest": [
            {"name": "Machine Chest Press", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["chest"], "equipment": "Machine"},
            {"name": "Cable Crossover", "sets": "3", "reps": "12-15", "rest": "60s",
             "target_muscles": ["chest"], "equipment": "Cable Machine"},
        ],
    },
    "Hip": {
        "legs": [
            {"name": "Leg Extension", "sets": "3", "reps": "12-15", "rest": "60s",
             "target_muscles": ["quads"], "equipment": "Machine"},
            {"name": "Lying Leg Curl", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["hamstrings"], "equipment": "Machine"},
            {"name": "Seated Calf Raise", "sets": "3", "reps": "15-20", "rest": "45s",
             "target_muscles": ["calves"], "equipment": "Machine"},
            {"name": "Adductor Machine (Light)", "sets": "3", "reps": "12-15", "rest": "45s",
             "target_muscles": ["adductors"], "equipment": "Machine"},
        ],
        "core": [
            {"name": "Dead Bug", "sets": "3", "reps": "10 each side", "rest": "45s",
             "target_muscles": ["core"], "equipment": "Bodyweight"},
            {"name": "Pallof Press", "sets": "3", "reps": "12 each side", "rest": "45s",
             "target_muscles": ["core", "obliques"], "equipment": "Cable Machine"},
        ],
        "cardio": [
            {"name": "Upper Body Ergometer", "sets": "1", "reps": "15 min", "rest": "none",
             "target_muscles": ["cardiovascular"], "equipment": "Machine"},
            {"name": "Seated Cycling (Low Resistance)", "sets": "1", "reps": "15 min", "rest": "none",
             "target_muscles": ["cardiovascular"], "equipment": "Machine"},
        ],
    },
    "Ankle": {
        "legs": [
            {"name": "Leg Press (Controlled)", "sets": "3", "reps": "10-12", "rest": "90s",
             "target_muscles": ["quads", "glutes"], "equipment": "Machine"},
            {"name": "Leg Extension", "sets": "3", "reps": "12-15", "rest": "60s",
             "target_muscles": ["quads"], "equipment": "Machine"},
            {"name": "Lying Leg Curl", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["hamstrings"], "equipment": "Machine"},
            {"name": "Hip Thrust", "sets": "3", "reps": "10-12", "rest": "60s",
             "target_muscles": ["glutes"], "equipment": "Barbell"},
            {"name": "Glute Bridge", "sets": "3", "reps": "12-15", "rest": "60s",
             "target_muscles": ["glutes"], "equipment": "Bodyweight"},
        ],
        "cardio": [
            {"name": "Seated Cycling", "sets": "1", "reps": "20 min", "rest": "none",
             "target_muscles": ["cardiovascular"], "equipment": "Machine"},
            {"name": "Swimming", "sets": "1", "reps": "20 min", "rest": "none",
             "target_muscles": ["full body"], "equipment": "Pool"},
        ],
    },
}


def _is_exercise_unsafe(exercise_name: str, injury: str) -> bool:
    """Check if an exercise is unsafe for a given injury."""
    blacklist = INJURY_EXERCISE_BLACKLIST.get(injury, [])
    name_lower = exercise_name.lower()
    for keyword in blacklist:
        if keyword.lower() in name_lower:
            return True
    return False


def _get_replacement(injury: str, focus_hint: str, used_names: set) -> Optional[Dict[str, Any]]:
    """Pick a safe replacement exercise for the given injury and focus area."""
    replacements = INJURY_SAFE_REPLACEMENTS.get(injury, {})

    # Try to match by focus hint first
    focus_lower = focus_hint.lower()
    for category, exercises in replacements.items():
        if category in focus_lower or focus_lower in category:
            for ex in exercises:
                if ex["name"] not in used_names:
                    used_names.add(ex["name"])
                    replacement = dict(ex)
                    return enrich_exercise_with_metadata(replacement)

    # Fallback: pick from any category
    for category, exercises in replacements.items():
        for ex in exercises:
            if ex["name"] not in used_names:
                used_names.add(ex["name"])
                replacement = dict(ex)
                return enrich_exercise_with_metadata(replacement)

    return None


# ── General exercise pool by focus area (for filling underpopulated days) ──

FOCUS_AREA_EXERCISES = {
    "chest": [
        {"name": "Bench Press", "sets": "3", "reps": "8-10", "rest": "90s",
            "target_muscles": ["chest", "triceps", "front delts"], "equipment": "Barbell"},
        {"name": "Incline Dumbbell Press", "sets": "3", "reps": "8-12", "rest": "90s",
            "target_muscles": ["upper chest", "front delts"], "equipment": "Dumbbell"},
        {"name": "Cable Flyes", "sets": "3", "reps": "10-15", "rest": "60s",
            "target_muscles": ["chest"], "equipment": "Cable"},
        {"name": "Dumbbell Flyes", "sets": "3", "reps": "10-12",
            "rest": "60s", "target_muscles": ["chest"], "equipment": "Dumbbell"},
        {"name": "Push-Ups", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["chest", "triceps"], "equipment": "Bodyweight"},
    ],
    "back": [
        {"name": "Lat Pulldown", "sets": "3", "reps": "8-12", "rest": "90s",
            "target_muscles": ["lats", "biceps"], "equipment": "Cable"},
        {"name": "Seated Cable Row", "sets": "3", "reps": "10-12", "rest": "90s",
            "target_muscles": ["middle back", "lats"], "equipment": "Cable"},
        {"name": "Barbell Rows", "sets": "3", "reps": "8-10", "rest": "90s",
            "target_muscles": ["middle back", "lats"], "equipment": "Barbell"},
        {"name": "Dumbbell Rows", "sets": "3", "reps": "10-12", "rest": "60s",
            "target_muscles": ["lats", "rear delts"], "equipment": "Dumbbell"},
        {"name": "Face Pulls", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["rear delts", "upper back"], "equipment": "Cable"},
    ],
    "shoulders": [
        {"name": "Overhead Press", "sets": "3", "reps": "8-10", "rest": "90s",
            "target_muscles": ["shoulders", "triceps"], "equipment": "Barbell"},
        {"name": "Lateral Raises", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["side delts"], "equipment": "Dumbbell"},
        {"name": "Face Pulls", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["rear delts"], "equipment": "Cable"},
        {"name": "Dumbbell Shoulder Press", "sets": "3", "reps": "8-12",
            "rest": "90s", "target_muscles": ["shoulders"], "equipment": "Dumbbell"},
        {"name": "Front Raises", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["front delts"], "equipment": "Dumbbell"},
    ],
    "triceps": [
        {"name": "Tricep Pushdown", "sets": "3", "reps": "10-12",
            "rest": "60s", "target_muscles": ["triceps"], "equipment": "Cable"},
        {"name": "Overhead Tricep Extension", "sets": "3", "reps": "10-12",
            "rest": "60s", "target_muscles": ["triceps"], "equipment": "Dumbbell"},
    ],
    "biceps": [
        {"name": "Barbell Curls", "sets": "3", "reps": "8-10", "rest": "60s",
            "target_muscles": ["biceps"], "equipment": "Barbell"},
        {"name": "Hammer Curls", "sets": "3", "reps": "10-12", "rest": "60s",
            "target_muscles": ["biceps", "forearms"], "equipment": "Dumbbell"},
        {"name": "Dumbbell Curls", "sets": "3", "reps": "10-12", "rest": "60s",
            "target_muscles": ["biceps"], "equipment": "Dumbbell"},
    ],
    "quads": [
        {"name": "Barbell Squat", "sets": "3", "reps": "8-10", "rest": "120s",
            "target_muscles": ["quads", "glutes"], "equipment": "Barbell"},
        {"name": "Leg Press", "sets": "3", "reps": "10-12", "rest": "90s",
            "target_muscles": ["quads", "glutes"], "equipment": "Machine"},
        {"name": "Leg Extension", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["quads"], "equipment": "Machine"},
        {"name": "Goblet Squat", "sets": "3", "reps": "10-12", "rest": "60s",
            "target_muscles": ["quads", "glutes"], "equipment": "Dumbbell"},
    ],
    "hamstrings": [
        {"name": "Romanian Deadlift", "sets": "3", "reps": "8-10", "rest": "90s",
            "target_muscles": ["hamstrings", "glutes"], "equipment": "Barbell"},
        {"name": "Leg Curl", "sets": "3", "reps": "10-12", "rest": "60s",
            "target_muscles": ["hamstrings"], "equipment": "Machine"},
    ],
    "glutes": [
        {"name": "Hip Thrust", "sets": "3", "reps": "10-12", "rest": "90s",
            "target_muscles": ["glutes"], "equipment": "Barbell"},
        {"name": "Bulgarian Split Squat", "sets": "3", "reps": "10-12", "rest": "60s",
            "target_muscles": ["glutes", "quads"], "equipment": "Dumbbell"},
    ],
    "core": [
        {"name": "Plank", "sets": "3", "reps": "30-60s", "rest": "60s",
            "target_muscles": ["core"], "equipment": "Bodyweight"},
        {"name": "Cable Woodchoppers", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["obliques", "core"], "equipment": "Cable"},
        {"name": "Hanging Leg Raises", "sets": "3", "reps": "10-15", "rest": "60s",
            "target_muscles": ["lower abs", "core"], "equipment": "Bodyweight"},
    ],
    "rear delts": [
        {"name": "Face Pulls", "sets": "3", "reps": "15-20", "rest": "60s",
            "target_muscles": ["rear delts", "upper back"], "equipment": "Cable"},
        {"name": "Reverse Pec Deck", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["rear delts"], "equipment": "Machine"},
        {"name": "Rear Delt Flyes", "sets": "3", "reps": "12-15", "rest": "60s",
            "target_muscles": ["rear delts"], "equipment": "Dumbbell"},
    ],
    "calves": [
        {"name": "Standing Calf Raises", "sets": "4", "reps": "15-20",
            "rest": "60s", "target_muscles": ["calves"], "equipment": "Machine"},
    ],
    "cardio": [
        {"name": "Treadmill HIIT", "sets": "1", "reps": "20 min",
            "rest": "N/A", "target_muscles": ["cardio"], "equipment": "Machine"},
    ],
}


def _get_focus_area_exercises(focus_hint: str) -> list:
    """
    Return a list of general exercises matching the focus area hint.
    Used to fill underpopulated days when neither the model nor
    the injury replacement pool has enough exercises.
    """
    focus_lower = focus_hint.lower()
    results = []
    for area, exercises in FOCUS_AREA_EXERCISES.items():
        if area in focus_lower:
            results.extend(exercises)
    # If no direct match, try partial keyword matching
    if not results:
        for area, exercises in FOCUS_AREA_EXERCISES.items():
            if any(word in focus_lower for word in area.split()):
                results.extend(exercises)
    return results


def filter_exercises_for_injuries(plan: Dict[str, Any], injuries: List[str]) -> Dict[str, Any]:
    """
    Post-process a generated workout plan to remove exercises that are
    unsafe for the user's reported injuries and replace them with safe
    alternatives. This is the DEFINITIVE safety layer because the small
    ML model cannot reliably follow injury constraints from prompt alone.
    """
    if not injuries or not plan:
        return plan

    used_names: set = set()  # track replacements already used to avoid duplicates
    removed_count = 0
    replaced_count = 0

    for day in plan.get("days", []):
        focus_hint = " ".join(day.get("focus_areas", []))
        day_name = day.get("day_name", "")
        focus_hint = f"{focus_hint} {day_name}"

        safe_exercises = []
        for exercise in day.get("exercises", []):
            ex_name = exercise.get("name", "")

            # Check against ALL reported injuries
            is_unsafe = False
            triggering_injury = ""
            for injury in injuries:
                if _is_exercise_unsafe(ex_name, injury):
                    is_unsafe = True
                    triggering_injury = injury
                    break

            if is_unsafe:
                removed_count += 1
                # Try to find a safe replacement
                replacement = _get_replacement(
                    triggering_injury, focus_hint, used_names)
                if replacement:
                    replacement["notes"] = f"⚠️ Replaced '{ex_name}' (unsafe for {triggering_injury} injury)"
                    safe_exercises.append(replacement)
                    replaced_count += 1
                    print(
                        f"   🔄 Replaced '{ex_name}' → '{replacement['name']}' ({triggering_injury})")
                else:
                    print(
                        f"   ❌ Removed '{ex_name}' (unsafe for {triggering_injury}, no replacement found)")
            else:
                safe_exercises.append(exercise)

        day["exercises"] = safe_exercises

        # ── Fill underpopulated days (< 3 exercises) with safe alternatives ──
        # Handles both empty days AND days where the model only generated 1-2 exercises.
        if len(safe_exercises) < 3:
            existing_names = {ex.get("name", "") for ex in safe_exercises}
            needed = 5 - len(safe_exercises)
            is_empty = len(safe_exercises) == 0
            print(
                f"   📋 Day '{day.get('day_name', '')}' has {len(safe_exercises)} exercises — adding up to {needed} more")

            # Strategy: For empty days (e.g. Leg Day with knee injury), prioritize
            # injury-safe replacements. For underpopulated days (e.g. Pull Day with
            # 1 exercise), prioritize general focus-area pool to stay on-topic.

            if is_empty and injuries:
                # ── Empty day: injury-safe replacements first ──
                for injury in injuries:
                    replacements = INJURY_SAFE_REPLACEMENTS.get(injury, {})
                    # Try focus-area match first
                    for category, exercises in replacements.items():
                        if category in focus_hint.lower():
                            for ex in exercises:
                                if ex["name"] not in used_names and ex["name"] not in existing_names and len(safe_exercises) < 5:
                                    replacement = dict(ex)
                                    replacement = enrich_exercise_with_metadata(
                                        replacement)
                                    replacement["notes"] = f"✅ Safe for {injury} injury"
                                    safe_exercises.append(replacement)
                                    used_names.add(ex["name"])
                                    existing_names.add(ex["name"])
                                    replaced_count += 1

                    # If still not enough, grab from any category
                    if len(safe_exercises) < 3:
                        for category, exercises in replacements.items():
                            for ex in exercises:
                                if ex["name"] not in used_names and ex["name"] not in existing_names and len(safe_exercises) < 5:
                                    replacement = dict(ex)
                                    replacement = enrich_exercise_with_metadata(
                                        replacement)
                                    replacement["notes"] = f"✅ Safe for {injury} injury"
                                    safe_exercises.append(replacement)
                                    used_names.add(ex["name"])
                                    existing_names.add(ex["name"])
                                    replaced_count += 1

            # ── General focus-area exercise pool (matches the day's focus) ──
            if len(safe_exercises) < 5:
                focus_pool = _get_focus_area_exercises(focus_hint)
                for ex in focus_pool:
                    if ex["name"] not in used_names and ex["name"] not in existing_names and len(safe_exercises) < 5:
                        replacement = dict(ex)
                        replacement = enrich_exercise_with_metadata(
                            replacement)
                        replacement["notes"] = "Auto-filled to meet minimum exercises"
                        safe_exercises.append(replacement)
                        used_names.add(ex["name"])
                        existing_names.add(ex["name"])
                        replaced_count += 1

            day["exercises"] = safe_exercises
            if safe_exercises:
                print(f"   ✅ Day now has {len(safe_exercises)} exercises")

        # ── Deduplicate exercises within the day ──
        seen_in_day = set()
        unique_exercises = []
        for ex in day["exercises"]:
            ex_name = ex.get("name", "")
            if ex_name not in seen_in_day:
                seen_in_day.add(ex_name)
                unique_exercises.append(ex)
            else:
                print(f"   🔁 Removed duplicate: '{ex_name}'")
        day["exercises"] = unique_exercises

    if removed_count > 0:
        injury_list = ", ".join(injuries)
        existing_notes = plan.get("notes", "")
        plan["notes"] = f"{existing_notes} | ⚠️ {removed_count} exercises filtered for injuries: {injury_list}. {replaced_count} replaced with safe alternatives."
        print(
            f"🛡️ Injury filter: {removed_count} removed, {replaced_count} replaced for [{injury_list}]")
    else:
        print(
            f"✅ Injury filter: all exercises are safe for [{', '.join(injuries)}]")

    return plan


# ============================================================
# API Endpoints
# ============================================================

@app.post("/generate-direct", response_model=DirectWorkoutResponse)
async def generate_direct(req: DirectWorkoutRequest) -> DirectWorkoutResponse:
    """
    Direct generation endpoint for frontend calls - includes RAG user context retrieval
    This is the OPTIMIZED endpoint that frontend should use directly
    """
    start_time = time.time()
    user_context_retrieved = False

    try:
        # 1. Retrieve user context from database (RAG pattern)
        user_context = {}
        if req.include_user_context:
            user_context = await retrieve_user_context(req.user_id)
            user_context_retrieved = len(user_context) > 0
            print(f"📊 User context retrieved: {user_context_retrieved}")

        # 2. Build prompt with user context
        prompt = build_prompt_with_context(req, user_context)
        print(f"📝 Prompt: {prompt[:200]}...")

        # 3. Generate plan using ML model (one call per day to avoid truncation)
        plan, is_valid, error = await generate_workout_plan_direct(
            prompt,
            req.days_per_week,
            req.goal,
            req.fitness_level,
            req.equipment,
            req.injuries,
        )

        # 4. Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)

        if not is_valid or plan is None:
            print(
                f"⚠️ ML model failed to generate valid workout plan. Error: {error}")
            return DirectWorkoutResponse(
                plan=None,
                is_valid_json=False,
                model_version=MODEL_VERSION,
                generation_latency_ms=latency_ms,
                user_context_retrieved=user_context_retrieved,
                error=error or "AI model failed to generate a valid workout plan"
            )

        # 5. Injury Post-Processing Filter
        # The small model can't reliably avoid exercises for injured areas,
        # so we deterministically filter and replace them here.
        if req.injuries:
            print(f"🛡️ Applying injury filter for: {req.injuries}")
            plan = filter_exercises_for_injuries(plan, req.injuries)

        print(f"✅ Plan generated successfully in {latency_ms}ms")

        return DirectWorkoutResponse(
            plan=plan,
            is_valid_json=is_valid,
            model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms,
            user_context_retrieved=user_context_retrieved,
            error=None
        )

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        print(f"❌ Error in generate_direct: {e}")
        return DirectWorkoutResponse(
            plan=None,
            is_valid_json=False,
            model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms,
            user_context_retrieved=user_context_retrieved,
            error=str(e)
        )


@app.get("/health")
def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_version": MODEL_VERSION,
        "device": device,
        "database_connected": db_pool is not None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/")
def root():
    """Root endpoint for basic status check"""
    return {
        "message": "Workout Plan Generator ML Service (Direct Mode) is running!",
        "model_version": MODEL_VERSION,
        "device": device,
        "endpoints": ["/generate-direct", "/health"],
        "optimization": "Frontend → FastAPI (direct) → PostgreSQL (RAG) → ML Model"
    }


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Uvicorn server on port 5301 (direct mode)...")
    print("📡 CORS enabled for frontend direct calls")
    print("🗄️ PostgreSQL RAG enabled for user context retrieval")
    uvicorn.run(app, host="0.0.0.0", port=5301)
