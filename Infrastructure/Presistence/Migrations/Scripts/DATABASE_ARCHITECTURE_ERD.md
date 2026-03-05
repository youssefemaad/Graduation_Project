# IntelliFit Database Architecture - ERD & Design Guide

## Version: 2.0.0 - AI/ML Ready Architecture

## Date: January 2025

---

## 📊 Entity Relationship Overview

### Core Domain Relationships

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER DOMAIN                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────┐ 1───1 ┌─────────────────┐ 1───* ┌────────────────┐                        │
│  │  Users   │───────│  MemberProfiles │───────│ InBodyMeasures │                        │
│  └──────────┘       └─────────────────┘       └────────────────┘                        │
│       │                     │                         │                                  │
│       │ 1                   │ 1                       │ *                               │
│       │                     │                         │                                  │
│       ▼ *                   ▼ *                       ▼                                 │
│  ┌──────────────┐    ┌─────────────┐          ┌─────────────────┐                       │
│  │ UserAchieve- │    │ WorkoutLogs │◄─────────│ UserFeature-    │                       │
│  │   ments      │    └─────────────┘          │   Snapshots     │                       │
│  └──────────────┘          │ 1                └─────────────────┘                       │
│       │ *                  │                         ▲                                   │
│       ▼                    ▼ *                       │                                   │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐                        │
│  │ Achievements │    │ WorkoutLog-     │    │ AI Inference     │                        │
│  └──────────────┘    │   Exercises     │    │   Logs           │                        │
│                      └─────────────────┘    └──────────────────┘                        │
│                            │ *                       │                                   │
│                            ▼                         ▼ *                                │
│                      ┌──────────────┐        ┌──────────────────┐                       │
│                      │  Exercises   │        │ AI Model         │                       │
│                      └──────────────┘        │   Versions       │                       │
│                                              └──────────────────┘                       │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### AI/ML Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AI/ML PIPELINE                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ╔═══════════════════════════════════════════════════════════════════════════════════╗  │
│  ║                            TRAINING DATA SOURCES                                   ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════════╣  │
│  ║  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ║  │
│  ║  │ WorkoutLogs   │   │ InBodyMeas.   │   │ WorkoutPlans  │   │ NutritionLogs │   ║  │
│  ║  └───────┬───────┘   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘   ║  │
│  ║          │                   │                   │                   │           ║  │
│  ║          └───────────────────┴───────────────────┴───────────────────┘           ║  │
│  ║                                        │                                          ║  │
│  ║                                        ▼                                          ║  │
│  ║                          ┌─────────────────────────┐                              ║  │
│  ║                          │  Feature Engineering    │                              ║  │
│  ║                          │  (Daily Batch Job)      │                              ║  │
│  ║                          └───────────┬─────────────┘                              ║  │
│  ║                                      │                                            ║  │
│  ║                                      ▼                                            ║  │
│  ║                          ┌─────────────────────────┐                              ║  │
│  ║                          │  UserFeatureSnapshots   │                              ║  │
│  ║                          │  (ML Feature Store)     │                              ║  │
│  ║                          └─────────────────────────┘                              ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════════╝  │
│                                          │                                               │
│                                          ▼                                               │
│  ╔═══════════════════════════════════════════════════════════════════════════════════╗  │
│  ║                            INFERENCE PIPELINE                                      ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                    ║  │
│  ║  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐          ║  │
│  ║  │ AiModelVersions │◄──────│ Model Selection │───────│ A/B Testing     │          ║  │
│  ║  │ (Model Registry)│       │ (by traffic %)  │       │ (comparison)    │          ║  │
│  ║  └────────┬────────┘       └─────────────────┘       └─────────────────┘          ║  │
│  ║           │                                                                        ║  │
│  ║           ▼                                                                        ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                          AiInferenceLogs                                     │  ║  │
│  ║  │  • Links to UserFeatureSnapshot (input features)                            │  ║  │
│  ║  │  • Links to ModelVersion (which model made prediction)                       │  ║  │
│  ║  │  • Stores output_result, confidence, latency                                 │  ║  │
│  ║  │  • Captures user_rating, was_accepted (feedback loop)                        │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────────┘  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Vector Search Architecture (RAG)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           SEMANTIC SEARCH (RAG) PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         Content Sources                                           │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐              │   │
│  │  │ Exercises │  │ Workout   │  │ Fitness   │  │ Coach-Generated   │              │   │
│  │  │           │  │ Plans     │  │ Knowledge │  │ Content           │              │   │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────────┬─────────┘              │   │
│  │        │              │              │                  │                         │   │
│  │        └──────────────┴──────────────┴──────────────────┘                         │   │
│  │                               │                                                    │   │
│  │                               ▼                                                    │   │
│  │                    ┌─────────────────────┐                                        │   │
│  │                    │   Text Embedding    │                                        │   │
│  │                    │  (OpenAI/HuggingFace)│                                       │   │
│  │                    └──────────┬──────────┘                                        │   │
│  │                               │                                                    │   │
│  │                               ▼                                                    │   │
│  │                    ┌─────────────────────┐                                        │   │
│  │                    │  VectorEmbeddings   │ ◄─── pgvector extension               │   │
│  │                    │  (vector(1536))     │      HNSW or IVFFlat index            │   │
│  │                    └─────────────────────┘                                        │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                               │
│                                          ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                       User Query Processing                                       │   │
│  │                                                                                    │   │
│  │  User: "What exercises are good for building chest muscles?"                      │   │
│  │                               │                                                    │   │
│  │                               ▼                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │   │
│  │  │  1. Embed query → vector(1536)                                              │  │   │
│  │  │  2. Search VectorEmbeddings using cosine similarity                         │  │   │
│  │  │  3. Retrieve top-K relevant documents                                        │  │   │
│  │  │  4. Augment LLM prompt with context                                          │  │   │
│  │  │  5. Generate personalized response                                           │  │   │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Entity Definitions

### 1. WorkoutLogExercise

**Purpose:** Replaces the JSON blob `WorkoutLog.ExercisesCompleted` with a queryable, normalized table.

| Column                    | Type          | Constraints                 | Description                |
| ------------------------- | ------------- | --------------------------- | -------------------------- |
| `workout_log_exercise_id` | SERIAL        | PK                          | Primary key                |
| `log_id`                  | INT           | FK → workout_logs, NOT NULL | Parent workout log         |
| `exercise_id`             | INT           | FK → exercises, NOT NULL    | Which exercise             |
| `order_performed`         | INT           | DEFAULT 1                   | Sequence in workout        |
| `sets_completed`          | INT           | DEFAULT 0                   | Number of sets done        |
| `reps_per_set`            | VARCHAR(100)  |                             | "12,10,8" format           |
| `weight_per_set`          | VARCHAR(100)  |                             | "100,100,105" format       |
| `total_volume`            | DECIMAL(12,2) |                             | Sets × Reps × Weight       |
| `rpe`                     | INT           | CHECK 1-10                  | Rate of Perceived Exertion |
| `is_personal_record`      | BOOLEAN       | DEFAULT FALSE               | PR flag                    |
| `created_at`              | TIMESTAMPTZ   | DEFAULT NOW()               |                            |

**Key Relationships:**

- `WorkoutLog` 1 ─ \* `WorkoutLogExercise` (cascade delete)
- `Exercise` 1 ─ \* `WorkoutLogExercise` (restrict delete)

---

### 2. Achievement & UserAchievement

**Purpose:** Replaces the JSON string `MemberProfile.Achievements` with a proper achievement tracking system.

**Achievement (Definition)**
| Column | Type | Description |
|--------|------|-------------|
| `achievement_id` | SERIAL PK | |
| `code` | VARCHAR(50) | UNIQUE, e.g., "WORKOUTS_100" |
| `name` | VARCHAR(100) | Display name |
| `description` | TEXT | What the user needs to do |
| `category` | VARCHAR(50) | workout, nutrition, consistency |
| `threshold_value` | INT | e.g., 100 for "100 workouts" |
| `token_reward` | INT | Tokens earned |
| `xp_reward` | INT | XP earned |
| `rarity` | VARCHAR(20) | common, rare, epic, legendary |

**UserAchievement (Progress)**
| Column | Type | Description |
|--------|------|-------------|
| `user_achievement_id` | SERIAL PK | |
| `user_id` | INT FK | User working on achievement |
| `achievement_id` | INT FK | Achievement definition |
| `current_progress` | INT | Progress toward threshold |
| `is_earned` | BOOLEAN | Has user completed it? |
| `earned_at` | TIMESTAMPTZ | When earned |
| `reward_claimed` | BOOLEAN | Has user claimed reward? |

---

### 3. UserFeatureSnapshot (ML Feature Store)

**Purpose:** Pre-computed ML features for consistent training and inference.

| Feature Group        | Columns                                                                       | ML Usage                          |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| **Demographics**     | age, gender, height_cm, weight_kg, bmi                                        | Base features for personalization |
| **Fitness Level**    | fitness_level, experience_years, body_fat_percentage, muscle_mass_kg          | Classification features           |
| **Activity Metrics** | workouts_last_30_days, total_minutes, avg_workout_duration, consistency_score | Engagement features               |
| **Strength Metrics** | bench_press_max, squat_max, deadlift_max, volume_progression_rate             | Strength progression              |
| **Preferences**      | preferred_workout_time, preferred_days, favorite_exercises                    | Personalization                   |
| **AI Interaction**   | ai_plans_generated, accepted, rejected, acceptance_rate                       | Feedback loop                     |

**Key Design Decisions:**

- `is_latest = TRUE` marks the current snapshot (filtered index)
- `feature_version` allows feature engineering evolution
- `computed_at` enables time-travel queries

---

### 4. AiModelVersion (Model Registry)

**Purpose:** Track and manage multiple AI model versions for A/B testing.

| Column                                | Type         | Description                 |
| ------------------------------------- | ------------ | --------------------------- |
| `model_name`                          | VARCHAR(100) | e.g., "workout_generator"   |
| `version`                             | VARCHAR(50)  | e.g., "v2.1.0"              |
| `traffic_percentage`                  | INT 0-100    | A/B test traffic allocation |
| `is_active`                           | BOOLEAN      | Is model receiving traffic? |
| `is_default`                          | BOOLEAN      | Fallback model              |
| `accuracy, precision, recall, f1`     | DECIMAL      | Evaluation metrics          |
| `average_latency_ms`                  | DECIMAL      | Performance metric          |
| `trained_at, deployed_at, retired_at` | TIMESTAMPTZ  | Lifecycle tracking          |

**A/B Testing Flow:**

1. Deploy new model with `traffic_percentage = 10`
2. Monitor `AiInferenceLogs` for both models
3. Compare `user_rating`, `was_accepted` metrics
4. Gradually increase traffic to winning model
5. Set `is_default = TRUE` when confident

---

### 5. AiInferenceLog

**Purpose:** Log every AI inference for monitoring, debugging, and feedback collection.

| Column                | Type         | Purpose                                    |
| --------------------- | ------------ | ------------------------------------------ |
| `user_id`             | INT FK       | Who requested inference                    |
| `model_version_id`    | INT FK       | Which model was used                       |
| `feature_snapshot_id` | INT FK       | Link to input features                     |
| `inference_type`      | VARCHAR(100) | workout_generation, fitness_classification |
| `input_features`      | JSONB        | Raw input (backup)                         |
| `output_result`       | JSONB        | What model returned                        |
| `confidence_scores`   | JSONB        | Model confidence                           |
| `latency_ms`          | INT          | Performance metric                         |
| `user_rating`         | INT 1-5      | User feedback                              |
| `was_accepted`        | BOOLEAN      | Did user use the output?                   |
| `user_feedback`       | TEXT         | Optional written feedback                  |

**Scalability Note:** Use `BIGSERIAL` for PK and consider table partitioning by `created_at` for high-volume production.

---

### 6. VectorEmbedding & FitnessKnowledge

**Purpose:** Enable semantic search and RAG (Retrieval-Augmented Generation).

**VectorEmbedding:**

- Stores embeddings for any content type (exercise, workout_plan, knowledge)
- Uses pgvector's `vector(1536)` type
- Indexed with IVFFlat or HNSW for fast similarity search

**FitnessKnowledge (RAG Knowledge Base):**
| Column | Type | Purpose |
|--------|------|---------|
| `category` | VARCHAR(50) | exercise_technique, nutrition, recovery |
| `title` | VARCHAR(255) | Document title |
| `content` | TEXT | Full document text |
| `tags` | TEXT[] | Array for filtering |
| `muscle_groups` | TEXT[] | Related muscle groups |
| `fitness_levels` | TEXT[] | beginner, intermediate, advanced |
| `priority` | DECIMAL | Ranking factor |

---

## 📈 Index Strategy

### High-Frequency Query Patterns

| Query Pattern              | Tables                   | Index                             |
| -------------------------- | ------------------------ | --------------------------------- |
| User's recent workout logs | `workout_logs`           | `(user_id, date DESC)`            |
| Exercises in a workout     | `workout_log_exercises`  | `(log_id, order_performed)`       |
| User's achievements        | `user_achievements`      | `(user_id, is_earned)`            |
| Active AI models           | `ai_model_versions`      | `(is_active) WHERE TRUE`          |
| Recent AI inferences       | `ai_inference_logs`      | `(created_at DESC)`               |
| Latest feature snapshot    | `user_feature_snapshots` | `(user_id, is_latest) WHERE TRUE` |

### Filtered Indexes (Partial)

```sql
-- Only index earned achievements (reduces index size)
CREATE INDEX idx_earned ON user_achievements(user_id) WHERE is_earned = TRUE;

-- Only index active models
CREATE INDEX idx_active_models ON ai_model_versions(model_name) WHERE is_active = TRUE;

-- Only index latest features
CREATE INDEX idx_latest_features ON user_feature_snapshots(user_id) WHERE is_latest = TRUE;
```

---

## 🔄 Migration Path

### Phase 1: Schema Creation (Non-Breaking)

1. Create all new tables alongside existing ones
2. Add new columns to `workout_logs` (`updated_at`, `overall_rpe`)
3. Deploy application with dual-write capability

### Phase 2: Data Migration

```sql
-- Migrate workout exercises from JSON
INSERT INTO workout_log_exercises (log_id, exercise_id, sets_completed, ...)
SELECT
    log_id,
    (json_element->>'ExerciseId')::INT,
    (json_element->>'SetsCompleted')::INT,
    ...
FROM workout_logs,
LATERAL jsonb_array_elements(exercises_completed::JSONB) AS json_element;
```

### Phase 3: Application Update

1. Update `WorkoutLogService` to write to `WorkoutLogExercises`
2. Update queries to read from normalized table
3. Mark `ExercisesCompleted` as `[Obsolete]` (done)

### Phase 4: Cleanup

1. Stop reading from JSON column
2. Drop deprecated columns in future migration

---

## 🛡️ Check Constraints

```sql
-- Rating constraints
ALTER TABLE ai_inference_logs ADD CONSTRAINT chk_user_rating
    CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5));

-- RPE constraints
ALTER TABLE workout_log_exercises ADD CONSTRAINT chk_rpe
    CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10));

-- Body composition
ALTER TABLE in_body_measurements ADD CONSTRAINT chk_body_fat
    CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100);

-- Traffic percentage
ALTER TABLE ai_model_versions ADD CONSTRAINT chk_traffic
    CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100);
```

---

## 📊 Sample Queries

### Get User's Workout Performance with Exercises

```sql
SELECT
    wl.log_id,
    wl.date,
    wl.duration_minutes,
    wl.overall_rpe,
    e.name AS exercise_name,
    wle.sets_completed,
    wle.reps_per_set,
    wle.weight_per_set,
    wle.total_volume,
    wle.is_personal_record
FROM workout_logs wl
JOIN workout_log_exercises wle ON wl.log_id = wle.log_id
JOIN exercises e ON wle.exercise_id = e.exercise_id
WHERE wl.user_id = @userId
ORDER BY wl.date DESC, wle.order_performed;
```

### Get User's Latest Feature Snapshot

```sql
SELECT * FROM user_feature_snapshots
WHERE user_id = @userId AND is_latest = TRUE;
```

### A/B Test Comparison

```sql
SELECT
    mv.model_name,
    mv.version,
    COUNT(*) AS total_inferences,
    AVG(il.user_rating) AS avg_rating,
    AVG(CASE WHEN il.was_accepted THEN 1.0 ELSE 0.0 END) AS acceptance_rate,
    AVG(il.latency_ms) AS avg_latency
FROM ai_inference_logs il
JOIN ai_model_versions mv ON il.model_version_id = mv.model_version_id
WHERE il.created_at >= NOW() - INTERVAL '7 days'
GROUP BY mv.model_name, mv.version
ORDER BY mv.model_name, acceptance_rate DESC;
```

### Semantic Search for Exercises

```sql
-- Requires pgvector extension
SELECT
    e.name,
    e.description,
    1 - (ve.embedding <=> @queryEmbedding) AS similarity
FROM vector_embeddings ve
JOIN exercises e ON ve.content_type = 'exercise' AND ve.content_id = e.exercise_id
WHERE ve.embedding IS NOT NULL
ORDER BY ve.embedding <=> @queryEmbedding
LIMIT 10;
```

---

## 🎯 Key Design Principles Applied

1. **Normalization over JSON Blobs**: Queryable, indexable, join-able data
2. **Feature Store Pattern**: Pre-computed ML features for consistency
3. **Model Registry**: Version, deploy, and A/B test ML models
4. **Inference Logging**: Every AI call logged for monitoring and feedback
5. **Vector Storage**: Semantic search capability for RAG
6. **Soft Delete Ready**: `IsDeleted`, `DeletedAt` in `AuditableEntity`
7. **Temporal Data**: `created_at`, `updated_at` on all tables
8. **Filtered Indexes**: Optimized for common query patterns
