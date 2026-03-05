# ML Models / AI Layer Analysis

## What Was Found

### Structure Overview
```
ml_models/
├── _ML/                              (Embedding microservice)
│   ├── embedding_server.py           (Flask, port 5100, MiniLM + pgvector)
│   ├── config.yaml                   (TensorFlow model config — NOT implemented)
│   ├── requirements.txt
│   └── Dockerfile
├── Workout-Plan_Generating/          (THE ONLY FUNCTIONAL AI MODULE)
│   ├── workout_api.py                (FastAPI, port 5300, flan-t5-small + LoRA)
│   ├── workout_api_direct.py         (FastAPI, port 5301, flan-t5-small + LoRA, PostgreSQL RAG)
│   ├── workout_api_v5.py             (FastAPI, port 5301, Qwen2.5-3B + QLoRA 4-bit)
│   ├── train_workout_generator_v3.py (LoRA training, 5K samples)
│   ├── train_workout_generator_v4.py (LoRA training, 15K samples, InBody integration)
│   ├── train_workout_generator_v5.py (QLoRA training, 10K samples, RP Strength science)
│   ├── build_exercise_db.py          (Master exercise database builder)
│   ├── dedup_exercises.py            (Deduplication pipeline)
│   ├── fetch_exercisedb.py           (ExerciseDB API fetcher)
│   ├── diagnose_data.py              (Data quality analysis)
│   ├── execute_sql.py                (SQL executor)
│   ├── export_csv.py                 (JSON → CSV exporter)
│   ├── generate_seed_sql.py          (JSON → SQL seed generator)
│   ├── generate_preview.py           (Sample generation)
│   ├── generate_preview_standalone.py (Standalone data generation)
│   ├── test_*.py                     (8 test scripts)
│   ├── check_cuda.py                 (CUDA check)
│   ├── api_requirements.txt
│   ├── requirements_v3.txt
│   ├── data/                         (exercise datasets, CSV, JSON)
│   ├── models/                       (trained model weights)
│   └── archive/                      (old scripts)
├── Ai-Coach-Chat/                    (EMPTY — no code)
├── LLM/                              (EMPTY — no code)
├── Nutrition-Plan_Generating/        (EMPTY — only Dataset/ with CSVs)
├── System Analytics AI/              (EMPTY — no code)
└── Vision Analyzer/                  (EMPTY — no code)
```

### Functional Components

#### 1. Embedding Service (_ML/embedding_server.py)
- **Stack**: Flask (port 5100) + `all-MiniLM-L6-v2` sentence transformer + pgvector
- **Endpoints**: `POST /embed` (returns vector), `POST /upsert` (stores in PostgreSQL), `GET /health`
- **Purpose**: Semantic search for fitness knowledge base
- **Status**: Implemented but **not integrated with main backend** (no C# service calls port 5100)

#### 2. Workout Plan Generation (3 API versions)

**workout_api.py (v3 — port 5300):**
- flan-t5-small + LoRA adapter
- `POST /predict` (C# compatible), `POST /generate`, `GET /health`
- Regex-based output parsing (`extract_workout_from_model_output()`)
- Comprehensive `INJURY_EXERCISE_BLACKLIST` with safe replacements per body part
- Post-processing filter for injury safety

**workout_api_direct.py (v3.1 — port 5301):**
- flan-t5-small + LoRA adapter
- `POST /generate-direct`, `GET /health`
- **Direct PostgreSQL** via asyncpg for RAG: fetches user InBody, MuscleScan, StrengthProfile
- 8000+ exercise CSV loading for enriched exercise selection
- Push/pull/legs cross-contamination prevention
- Exercise validation against DB
- Underpopulated-day filling
- **This is what the C# MLServiceClient connects to**

**workout_api_v5.py (v5 — port 5301):**
- **Qwen2.5-3B-Instruct** + QLoRA 4-bit (NF4)
- Compact text format parsing (not JSON)
- Optional asyncpg RAG
- More sophisticated model but needs GPU for practical use

#### 3. Training Pipeline (3 versions)

| Version | Model | Samples | Key Features |
|---|---|---|---|
| v3 | flan-t5-small | 5,000 | LoRA (r=64, α=128), basic prompt→plan, beam search |
| v4 | flan-t5-base | 15,000 | LoRA, InBody integration, injury severity, RPE/tempo, progressive overload, deload weeks |
| v5 | Qwen2.5-3B | 10,000 | QLoRA 4-bit, **RP Strength Volume Landmarks** (MV/MEV/MAV/MRV), mesocycle configs, 6 expert programs (Starting Strength, 5/3/1, PHUL, PPL, etc.), SFR-based scoring |

#### 4. Exercise Data Pipeline
- **3 data sources**: free-exercise-db, strength.json, ExerciseDB v1 API
- **build_exercise_db.py**: Merges all sources, computes 6 science-backed fields per exercise:
  - `fatigue_score` (1-10), `stimulus_score` (1-10), `SFR ratio`, `axial_load` (0-10), `recovery_time_hours` (24-96), `skill_level` + `contraindications`
- **dedup_exercises.py**: Canonical name deduplication with richness-based merge
- **generate_seed_sql.py**: Generates SQL for PostgreSQL seeding

### Key Architecture Patterns
1. **Injury safety = post-processing**: Small models can't follow injury constraints from prompts alone, so `filter_exercises_for_injuries()` deterministically removes/replaces unsafe exercises AFTER generation
2. **RAG from PostgreSQL**: workout_api_direct.py queries user InBody/MuscleScan/StrengthProfile data to personalize prompts
3. **Cross-contamination prevention**: Push/pull/legs selection uses exclusion sets to prevent wrong-category exercises
4. **Expert programs in training data**: v5 includes 6 real-world programs mapped to DB exercises for 40% of training data

---

## What Is Missing

### Critical — Empty Modules (5 of 6 directories are empty/unused)
1. **Ai-Coach-Chat/** — EMPTY. The "AI coach chat" in the C# backend uses Groq API directly (no custom model). No dedicated Python service exists
2. **LLM/** — EMPTY. No LLM service code. All LLM usage (Groq, Gemini) is done directly from C# via HTTP
3. **Nutrition-Plan_Generating/** — EMPTY (only CSV datasets). Nutrition plan generation in C# uses Gemini API directly. No custom model
4. **System Analytics AI/** — EMPTY. No analytics/prediction models exist. No churn prediction, attendance forecasting, revenue analysis, etc.
5. **Vision Analyzer/** — EMPTY. The C# WorkoutAIController references CLIP for muscle scan analysis, but no Python service exists. The C# service has a `MergeMuscleScans()` method but no actual vision model integration

### Missing AI Capabilities for CRM Smart Gym
6. **No recommendation engine** — No collaborative filtering or content-based recommendations for workouts, coaches, equipment
7. **No churn prediction model** — No ML model to predict member churn risk
8. **No attendance forecasting** — No time-series model for gym occupancy prediction
9. **No anomaly detection** — No model for detecting unusual patterns (equipment overuse, safety issues)
10. **No NLP for feedback** — No sentiment analysis on coach reviews or workout feedback
11. **No nutrition plan ML model** — Currently uses Gemini prompts (expensive, no fine-tuning)
12. **No sleep/recovery analysis** — No integration with wearable data
13. **No exercise form analysis** — Vision Analyzer module was planned but never implemented

### Integration Gaps
14. **Embedding service not integrated** — Flask server at port 5100 exists but C# backend never calls it. `FitnessKnowledge` entity + `VectorEmbedding` entity defined but unused
15. **config.yaml references unimplemented models** — TensorFlow DNN for nutrition and LSTM for workout mentioned in config but never built
16. **Multiple API versions running on same port** — workout_api_direct.py and workout_api_v5.py both target port 5301. Only one can run at a time; no version management
17. **No model serving infrastructure** — No MLflow, no model registry, no A/B testing, no canary deployment
18. **No monitoring** — No model performance tracking, no drift detection

---

## What Needs Updating

### P0 — Must Fix
1. **Decide on ONE workout API version** — Currently 3 API files can run on port 5301. Pick v3.1 (workout_api_direct.py) for CPU or v5 (workout_api_v5.py) for GPU. Remove/archive the rest
2. **Fix hardcoded database credentials** — workout_api_direct.py has PostgreSQL credentials hardcoded. Use environment variables
3. **Integrate embedding service** — Connect C# backend to Flask embedding service at port 5100, or remove the `_ML/` code and VectorEmbedding entity

### P1 — Implement Core AI
4. **Implement nutrition plan generation** — Either:
   - Train a model similar to workout generator (flan-t5 + LoRA on nutrition data), OR
   - Keep Gemini but add structured output parsing and validation
5. **Implement AI coach chat** — Either:
   - Fine-tune a model for fitness coaching conversations, OR
   - Keep Groq/Gemini but add RAG with fitness knowledge base (embedding service exists for this)
6. **Implement vision/muscle scan** — CLIP integration for body analysis:
   - Build Python service with CLIP + body part detection
   - Connect to C# WorkoutAIController's muscle scan endpoint

### P2 — Enhance AI System
7. **Add model serving infrastructure** — Use FastAPI as unified gateway for all models, with versioned endpoints
8. **Add model monitoring** — Track inference latency, error rates, output quality metrics
9. **Add A/B testing** — Route users to different model versions to measure plan quality
10. **Build recommendation engine** — Collaborative filtering for coach matching, equipment suggestions
11. **Add churn prediction** — Train model on attendance patterns, booking history, subscription data
12. **Add attendance forecasting** — Time-series model for gym capacity planning
13. **Dockerize all AI services** — Currently only `_ML/` has a Dockerfile. Create Dockerfiles for workout API
14. **Archive unused directories** — Remove or clearly mark Ai-Coach-Chat/, LLM/, System Analytics AI/, Vision Analyzer/ as not-implemented
