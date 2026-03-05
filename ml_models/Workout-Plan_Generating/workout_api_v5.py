"""
Workout Plan Generator v5 - API Server
=======================================
FastAPI service using fine-tuned Qwen2.5-3B-Instruct with QLoRA.
Parses compact text output into structured JSON.

Features:
- Qwen2.5-3B-Instruct inference (4-bit quantized)
- Compact text output → structured JSON conversion
- PostgreSQL RAG for user context (InBody, injuries)
- Injury safety post-processing
- No fallback/mock data - pure AI generation
"""

import asyncio
import json
import time
import re
import sys
import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# UTF-8 for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = Path(__file__).parent
MODEL_DIR = SCRIPT_DIR / "models" / "workout-generator-v5"
LORA_DIR = MODEL_DIR / "lora_adapter"
BASE_MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
MODEL_VERSION = "v5.0.0"
EXERCISE_DB_FILE = SCRIPT_DIR / "data" / "exercises_final.json"

print("=" * 60)
print("Workout Plan Generator v5 API")
print("=" * 60)

# ============================================================
# Load Exercise Database (for enrichment and validation)
# ============================================================
exercise_db = []
exercise_by_name = {}
exercise_by_muscle = {}
exercise_by_pattern = {}

if EXERCISE_DB_FILE.exists():
    with open(EXERCISE_DB_FILE, "r", encoding="utf-8") as f:
        exercise_db = json.load(f)
    for ex in exercise_db:
        exercise_by_name[ex["name"].lower()] = ex
        for m in ex.get("primaryMuscles", []):
            exercise_by_muscle.setdefault(m, []).append(ex)
        pat = ex.get("movement_pattern", "other")
        exercise_by_pattern.setdefault(pat, []).append(ex)
    print(f"Exercise DB: {len(exercise_db)} exercises loaded")
else:
    print(f"WARNING: Exercise DB not found at {EXERCISE_DB_FILE}")

# ============================================================
# Load Model
# ============================================================

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device: {device}")

model = None
tokenizer = None

try:
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
    from peft import PeftModel

    print(f"Loading tokenizer from {BASE_MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL_NAME, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    print("Tokenizer loaded")

    # Check if fine-tuned model exists
    if LORA_DIR.exists() and (LORA_DIR / "adapter_config.json").exists():
        print(f"Loading base model with 4-bit quantization...")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_NAME,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
        print("Base model loaded, applying LoRA adapter...")
        model = PeftModel.from_pretrained(base_model, str(LORA_DIR))
        model.eval()
        print(f"Fine-tuned model ready (LoRA from {LORA_DIR})")
    elif MODEL_DIR.exists() and (MODEL_DIR / "adapter_config.json").exists():
        # LoRA adapter saved directly in MODEL_DIR
        print(f"Loading base model with 4-bit quantization...")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_NAME,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
        print("Base model loaded, applying LoRA adapter...")
        model = PeftModel.from_pretrained(base_model, str(MODEL_DIR))
        model.eval()
        print(f"Fine-tuned model ready (LoRA from {MODEL_DIR})")
    else:
        # No fine-tuned model yet - use base model
        print("No fine-tuned model found. Using base Qwen2.5-3B-Instruct...")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_NAME,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
        model.eval()
        print("Base model loaded (not fine-tuned)")

    if torch.cuda.is_available():
        mem = torch.cuda.memory_allocated() / 1e9
        print(f"VRAM used: {mem:.2f} GB")

except Exception as e:
    print(f"ERROR loading model: {e}")
    import traceback
    traceback.print_exc()

print("=" * 60)

# ============================================================
# System Prompt
# ============================================================

SYSTEM_PROMPT = """You are an expert fitness AI that generates personalized workout plans. You create complete, scientifically-sound training programs based on the user's profile, goals, injuries, and feedback. Output plans in compact format only."""

# ============================================================
# Compact Output Parser
# ============================================================


def parse_compact_plan(text: str) -> Dict[str, Any]:
    """
    Parse compact text format into structured JSON.

    Input format:
    PLAN:6d PPL x2|Muscle|Intermediate|8w
    INJ:shoulder(moderate,5/10):avoid overhead
    FB:harder pref,rating 4.2,30 sessions
    ---
    D1:Push A[chest,shoulders,triceps]60min
    1.Bench Press|4x8-12|90s|C|RPE8|barbell
    ---
    PROG:...
    DELOAD:...
    """
    plan = {
        "plan_name": "",
        "goal": "",
        "fitness_level": "",
        "days_per_week": 0,
        "program_duration_weeks": 8,
        "days": [],
        "progressive_overload": {},
        "deload": {},
        "injury_notes": [],
        "feedback_notes": "",
    }

    lines = text.strip().split("\n")
    current_day = None
    current_day_idx = 0

    for line in lines:
        line = line.strip()
        if not line or line == "---":
            continue

        # PLAN header
        if line.startswith("PLAN:"):
            header = line[5:]
            parts = header.split("|")
            if len(parts) >= 3:
                plan["plan_name"] = parts[0].strip()
                plan["goal"] = parts[1].strip()
                plan["fitness_level"] = parts[2].strip()
            if len(parts) >= 4:
                weeks_match = re.search(r"(\d+)w", parts[3])
                if weeks_match:
                    plan["program_duration_weeks"] = int(weeks_match.group(1))
            # Extract days from plan name
            days_match = re.search(r"(\d+)d", header)
            if days_match:
                plan["days_per_week"] = int(days_match.group(1))

        # Injury notes
        elif line.startswith("INJ:"):
            plan["injury_notes"] = [n.strip()
                                    for n in line[4:].split(";") if n.strip()]

        # Feedback
        elif line.startswith("FB:"):
            plan["feedback_notes"] = line[3:].strip()

        # Day header: D1:Push A[chest,shoulders,triceps]60min
        elif re.match(r"D\d+:", line):
            match = re.match(r"D(\d+):(.+?)(?:\[(.+?)\])?(\d+min)?$", line)
            if match:
                day_num = int(match.group(1))
                day_name = match.group(2).strip()
                muscles_str = match.group(3) or ""
                duration_str = match.group(4) or ""

                muscles = [m.strip()
                           for m in muscles_str.split(",") if m.strip()]
                duration = int(
                    re.search(r"(\d+)", duration_str).group(1)) if duration_str else 55

                current_day = {
                    "day_number": day_num,
                    "day_name": f"Day {day_num}: {day_name}",
                    "focus_areas": muscles,
                    "estimated_duration_minutes": duration,
                    "exercises": [],
                }
                plan["days"].append(current_day)
                current_day_idx = day_num

        # Exercise: 1.Bench Press|4x8-12|90s|C|RPE8|barbell|*MODIFIED
        elif re.match(r"\d+\.", line) and current_day is not None:
            ex = _parse_exercise_line(line)
            if ex:
                current_day["exercises"].append(ex)

        # Progressive overload
        elif line.startswith("PROG:"):
            plan["progressive_overload"] = {"description": line[5:].strip()}

        # Deload
        elif line.startswith("DELOAD:"):
            plan["deload"] = {"description": line[7:].strip()}

    return plan


def _parse_exercise_line(line: str) -> Optional[Dict]:
    """
    Parse exercise line: 1.Bench Press|4x8-12|90s|C|RPE8|barbell|*MODIFIED
    """
    # Remove leading number and dot
    match = re.match(r"\d+\.(.+)", line)
    if not match:
        return None

    content = match.group(1)
    parts = content.split("|")

    if len(parts) < 3:
        return None

    name = parts[0].strip()

    # Parse sets x reps: "4x8-12"
    sets_reps = parts[1].strip() if len(parts) > 1 else "3x8-12"
    sr_match = re.match(r"(\d+)x(\d+)-?(\d+)?", sets_reps)
    sets = "3"
    reps = "8-12"
    if sr_match:
        sets = sr_match.group(1)
        if sr_match.group(3):
            reps = f"{sr_match.group(2)}-{sr_match.group(3)}"
        else:
            reps = sr_match.group(2)

    # Rest
    rest = parts[2].strip() if len(parts) > 2 else "60s"
    if not rest.endswith("s"):
        rest += "s"

    # Type (C=compound, I=isolation)
    ex_type = "compound"
    if len(parts) > 3:
        t = parts[3].strip().upper()
        if t == "I":
            ex_type = "isolation"
        elif t == "C":
            ex_type = "compound"

    # RPE
    rpe = ""
    if len(parts) > 4:
        rpe = parts[4].strip()

    # Equipment
    equipment = ""
    if len(parts) > 5:
        equipment = parts[5].strip()

    # Injury marker
    notes = ""
    if len(parts) > 6:
        marker = parts[6].strip()
        if "*MODIFIED" in marker:
            notes = "Modified for injury safety"
        elif "*LIGHT" in marker:
            notes = "Use lighter weight due to injury"
        elif "*MONITOR" in marker:
            notes = "Monitor for discomfort"

    # Enrich from exercise database
    db_entry = exercise_by_name.get(name.lower())
    target_muscles = []
    movement_pattern = "other"

    if db_entry:
        target_muscles = db_entry.get("primaryMuscles", [])[:3]
        movement_pattern = db_entry.get("movement_pattern", "other")
        if not equipment:
            equipment = db_entry.get("equipment", "body only")

    return {
        "name": name,
        "sets": sets,
        "reps": reps,
        "rest": rest,
        "exercise_type": ex_type,
        "intensity": rpe,
        "equipment": equipment,
        "target_muscles": target_muscles,
        "movement_pattern": movement_pattern,
        "notes": notes,
    }


# ============================================================
# Generation
# ============================================================

def _generate_sync(user_message: str) -> str:
    """Synchronous generation with Qwen2.5"""
    if model is None or tokenizer is None:
        raise RuntimeError("Model not loaded")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )

    inputs = tokenizer(text, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=1500,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.1,
            pad_token_id=tokenizer.eos_token_id,
        )

    # Decode only the generated part (exclude input)
    input_len = inputs["input_ids"].shape[1]
    generated = outputs[0][input_len:]
    result = tokenizer.decode(generated, skip_special_tokens=True)

    return result


async def generate_plan(
    level: str,
    goal: str,
    days: int,
    equipment: List[str] = None,
    injuries: List[Dict] = None,
    inbody: Dict = None,
    feedback: Dict = None,
) -> tuple[Optional[Dict], bool, Optional[str]]:
    """Generate a workout plan using the fine-tuned model"""

    # Build user message
    parts = [f"Level: {level}", f"Goal: {goal}", f"Days: {days}"]

    if inbody:
        bf = inbody.get("body_fat_percent")
        mm = inbody.get("muscle_mass_kg")
        if bf:
            cat = "lean" if bf < 15 else "normal" if bf < 23 else "higher" if bf < 31 else "obese"
            parts.append(f"Body fat: {bf}% ({cat})")
        if mm:
            cat = "low" if mm < 28 else "average" if mm < 38 else "high"
            parts.append(f"Muscle mass: {mm}kg ({cat})")

    if injuries:
        inj_strs = []
        for inj in injuries:
            if isinstance(inj, dict):
                part = inj.get("part", inj.get("body_part", ""))
                sev = inj.get("severity", 5)
                label = "mild" if sev <= 3 else "moderate" if sev <= 6 else "severe"
                inj_strs.append(f"{part}({label},{sev}/10)")
            elif isinstance(inj, str):
                inj_strs.append(f"{inj}(moderate,5/10)")
        if inj_strs:
            parts.append(f"Injuries: {','.join(inj_strs)}")

    if feedback:
        diff = feedback.get("difficulty", "normal")
        rating = feedback.get("rating", 4.0)
        sessions = feedback.get("sessions", 10)
        parts.append(
            f"Feedback: {diff} difficulty, rating {rating}, {sessions} sessions done")

    if equipment:
        parts.append(f"Equipment: {','.join(equipment[:8])}")

    # Prompt
    prompt_templates = [
        f"Generate a {days}-day {goal.lower()} workout plan",
        f"Create a {days}-day {goal.lower()} program",
        f"Build a {days} day {goal.lower()} routine",
    ]
    import random
    prompt = random.choice(prompt_templates)
    user_message = f"{prompt}\n[Context] {' | '.join(parts)}"

    print(f"\nGenerating {days}-day {goal} plan ({level})...")
    print(f"  Prompt: {user_message[:200]}...")

    try:
        loop = asyncio.get_event_loop()
        raw_output = await loop.run_in_executor(None, _generate_sync, user_message)
        print(f"  Output: {len(raw_output)} chars")
        print(f"  Preview: {raw_output[:300]}")
    except Exception as e:
        print(f"  Generation error: {e}")
        return None, False, f"Model generation failed: {e}"

    # Parse compact format
    try:
        plan = parse_compact_plan(raw_output)
    except Exception as e:
        print(f"  Parse error: {e}")
        return None, False, f"Failed to parse model output: {e}"

    # Validate plan has content
    if not plan.get("days"):
        return None, False, "Model generated empty plan"

    total_ex = sum(len(d.get("exercises", [])) for d in plan["days"])
    if total_ex == 0:
        return None, False, "Model generated no exercises"

    # Fill missing metadata
    if not plan.get("goal"):
        plan["goal"] = goal
    if not plan.get("fitness_level"):
        plan["fitness_level"] = level
    if not plan.get("days_per_week"):
        plan["days_per_week"] = days

    print(f"  Parsed: {len(plan['days'])} days, {total_ex} exercises")
    return plan, True, None


# ============================================================
# Injury Post-Processing
# ============================================================

INJURY_BLACKLIST = {
    "Lower Back": ["deadlift", "good morning", "barbell row", "bent over row",
                   "back squat", "front squat", "clean", "snatch", "hyperextension",
                   "sit-up", "situp", "kettlebell swing"],
    "Shoulder": ["overhead press", "military press", "shoulder press", "arnold press",
                 "upright row", "lateral raise", "front raise", "behind the neck",
                 "bench press", "incline press", "dip"],
    "Knee": ["squat", "leg press", "lunge", "leg extension", "box jump",
             "jump squat", "pistol squat", "step up", "hack squat"],
    "Wrist": ["barbell curl", "wrist curl", "push-up", "pushup", "bench press",
              "clean", "snatch", "front squat", "handstand"],
    "Elbow": ["skull crusher", "tricep extension", "overhead extension",
              "close grip bench", "preacher curl", "dip", "chin-up", "pull-up"],
    "Hip": ["squat", "deadlift", "lunge", "hip thrust", "leg press",
            "step up", "good morning", "box jump"],
    "Ankle": ["squat", "lunge", "calf raise", "box jump", "jump squat",
              "jump rope", "running", "burpee"],
}


def _is_exercise_unsafe(name: str, injury: str) -> bool:
    blacklist = INJURY_BLACKLIST.get(injury, [])
    name_lower = name.lower()
    return any(kw in name_lower for kw in blacklist)


def filter_injuries(plan: Dict, injuries: List[str]) -> Dict:
    """Remove unsafe exercises and note the changes"""
    if not injuries or not plan:
        return plan

    removed = 0
    for day in plan.get("days", []):
        safe = []
        for ex in day.get("exercises", []):
            is_unsafe = False
            for inj in injuries:
                if _is_exercise_unsafe(ex.get("name", ""), inj):
                    is_unsafe = True
                    print(f"  Removed '{ex['name']}' (unsafe for {inj})")
                    removed += 1
                    break
            if not is_unsafe:
                safe.append(ex)
        day["exercises"] = safe

        # If a day lost too many exercises, fill from DB
        if len(safe) < 3:
            muscles = day.get("focus_areas", [])
            _fill_day_from_db(day, muscles, injuries,
                              plan.get("goal", "Muscle"))

    if removed > 0:
        plan.setdefault("notes", "")
        plan["notes"] += f" {removed} exercises filtered for injury safety."

    return plan


def _fill_day_from_db(day: Dict, muscles: List[str], injuries: List[str], goal: str):
    """Fill underpopulated day from exercise database"""
    used = {ex["name"].lower() for ex in day.get("exercises", [])}
    needed = 5 - len(day.get("exercises", []))

    for muscle in muscles:
        if needed <= 0:
            break
        candidates = exercise_by_muscle.get(muscle, [])
        for ex in candidates:
            if ex["name"].lower() in used:
                continue
            # Check injury safety
            safe = True
            for inj in injuries:
                if _is_exercise_unsafe(ex["name"], inj):
                    safe = False
                    break
            if not safe:
                continue

            rr = ex.get("rep_ranges_by_goal", {}).get(goal, {})
            day["exercises"].append({
                "name": ex["name"],
                "sets": str(rr.get("sets", 3)),
                "reps": f"{rr.get('min_reps', 8)}-{rr.get('max_reps', 12)}",
                "rest": f"{rr.get('rest_seconds', 60)}s",
                "exercise_type": ex.get("mechanic", "compound"),
                "equipment": ex.get("equipment", "body only"),
                "target_muscles": ex.get("primaryMuscles", [])[:3],
                "movement_pattern": ex.get("movement_pattern", "other"),
                "notes": "Added for minimum exercises",
            })
            used.add(ex["name"].lower())
            needed -= 1
            if needed <= 0:
                break


# ============================================================
# Database RAG (optional - for user context retrieval)
# ============================================================

db_pool = None

try:
    import asyncpg
    HAS_ASYNCPG = True
except ImportError:
    HAS_ASYNCPG = False
    print("asyncpg not installed - database RAG disabled")

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "PulseGym_v1.0.1",
    "user": "postgres",
    "password": "123",
}


async def init_db():
    global db_pool
    if not HAS_ASYNCPG:
        return
    try:
        db_pool = await asyncpg.create_pool(**DB_CONFIG, min_size=2, max_size=10)
        print("Database pool created")
    except Exception as e:
        print(f"Database connection failed: {e}")


async def get_user_context(user_id: int) -> Dict:
    """Retrieve InBody + injuries from database"""
    if not db_pool:
        return {}

    ctx = {}
    try:
        async with db_pool.acquire() as conn:
            # InBody
            row = await conn.fetchrow("""
                SELECT "MuscleMass", "BodyFatPercentage"
                FROM "InBodyMeasurements"
                WHERE "UserId" = $1
                ORDER BY "CreatedAt" DESC LIMIT 1
            """, user_id)
            if row:
                ctx["inbody"] = {
                    "muscle_mass_kg": float(row["MuscleMass"]) if row["MuscleMass"] else None,
                    "body_fat_percent": float(row["BodyFatPercentage"]) if row["BodyFatPercentage"] else None,
                }
    except Exception as e:
        print(f"DB query error: {e}")

    return ctx


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(
    title="Workout Plan Generator v5",
    version=MODEL_VERSION,
    description="Qwen2.5-3B-Instruct fine-tuned workout plan generator",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()


# ============================================================
# Request/Response Models
# ============================================================

class WorkoutRequest(BaseModel):
    user_id: int = 0
    fitness_level: str = "Intermediate"
    goal: str = "Muscle"
    days_per_week: int = 4
    equipment: List[str] = Field(default_factory=list)
    injuries: List[str] = Field(default_factory=list)
    include_user_context: bool = False


class WorkoutResponse(BaseModel):
    plan: Optional[Dict[str, Any]] = None
    is_valid_json: bool = False
    model_version: str = MODEL_VERSION
    generation_latency_ms: int = 0
    user_context_retrieved: bool = False
    error: Optional[str] = None


# ============================================================
# Endpoints
# ============================================================

@app.post("/generate-direct", response_model=WorkoutResponse)
async def generate_direct(req: WorkoutRequest) -> WorkoutResponse:
    """Generate a personalized workout plan"""
    start = time.time()
    user_ctx_retrieved = False

    try:
        # Retrieve user context from DB if requested
        inbody = None
        if req.include_user_context and req.user_id > 0:
            ctx = await get_user_context(req.user_id)
            if ctx.get("inbody"):
                inbody = ctx["inbody"]
                user_ctx_retrieved = True

        # Convert string injuries to dict format
        injury_dicts = None
        if req.injuries:
            injury_dicts = [{"part": inj, "severity": 5}
                            for inj in req.injuries]

        # Generate
        plan, is_valid, error = await generate_plan(
            level=req.fitness_level,
            goal=req.goal,
            days=req.days_per_week,
            equipment=req.equipment or None,
            injuries=injury_dicts,
            inbody=inbody,
        )

        latency = int((time.time() - start) * 1000)

        if not is_valid or plan is None:
            return WorkoutResponse(
                plan=None, is_valid_json=False,
                model_version=MODEL_VERSION,
                generation_latency_ms=latency,
                user_context_retrieved=user_ctx_retrieved,
                error=error or "Failed to generate plan",
            )

        # Apply injury safety filter
        if req.injuries:
            plan = filter_injuries(plan, req.injuries)

        print(f"Plan generated in {latency}ms")
        return WorkoutResponse(
            plan=plan, is_valid_json=True,
            model_version=MODEL_VERSION,
            generation_latency_ms=latency,
            user_context_retrieved=user_ctx_retrieved,
        )

    except Exception as e:
        latency = int((time.time() - start) * 1000)
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return WorkoutResponse(
            plan=None, is_valid_json=False,
            model_version=MODEL_VERSION,
            generation_latency_ms=latency,
            error=str(e),
        )


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_version": MODEL_VERSION,
        "device": device,
        "exercise_db_size": len(exercise_db),
        "database_connected": db_pool is not None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/")
def root():
    return {
        "message": "Workout Plan Generator v5 is running",
        "model": BASE_MODEL_NAME,
        "version": MODEL_VERSION,
        "fine_tuned": LORA_DIR.exists(),
        "exercises": len(exercise_db),
        "endpoints": ["/generate-direct", "/health"],
    }


if __name__ == "__main__":
    import uvicorn
    print("Starting server on port 5301...")
    uvicorn.run(app, host="0.0.0.0", port=5301)
