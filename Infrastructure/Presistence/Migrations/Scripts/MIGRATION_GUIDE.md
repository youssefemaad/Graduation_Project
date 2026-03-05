# Database Architecture Upgrade - Migration Guide

## 📋 Overview

This guide documents the IntelliFit database architecture upgrade from v1.x to v2.0.0, transforming the database from a basic CRUD system to a production-ready, AI/ML-optimized architecture.

---

## 🎯 What Changed?

### Major Improvements

| Area                  | Before (v1.x)                                   | After (v2.0.0)                              |
| --------------------- | ----------------------------------------------- | ------------------------------------------- |
| **Exercise Tracking** | JSON blob in `workout_logs.exercises_completed` | Normalized `workout_log_exercises` table    |
| **Achievements**      | JSON array in `member_profiles.achievements`    | `achievements` + `user_achievements` tables |
| **ML Features**       | ❌ None                                         | ✅ `user_feature_snapshots` (feature store) |
| **Model Versioning**  | ❌ None                                         | ✅ `ai_model_versions` (A/B testing)        |
| **Inference Logging** | ❌ None                                         | ✅ `ai_inference_logs` (monitoring)         |
| **Semantic Search**   | ❌ None                                         | ✅ `vector_embeddings` (pgvector)           |
| **RAG Knowledge**     | ❌ None                                         | ✅ `fitness_knowledge` (AI context)         |
| **Queryability**      | ❌ Can't query JSON                             | ✅ Fully indexed and queryable              |

---

## 🚀 Quick Start

### Step 1: Apply Schema Migration

The schema migration has already been applied to your database (`PulseGym_v1.0.1`):

```bash
dotnet ef database update --project Infrastructure/Presistence --startup-project Graduation-Project
```

✅ **Status:** Complete (9 new tables created)

### Step 2: Run Data Migration

Migrate existing JSON data to normalized tables:

```sql
-- Run the data migration script
psql -h localhost -U postgres -d PulseGym_v1.0.1 -f Infrastructure/Presistence/Migrations/Scripts/V2_0_0_Data_Migration.sql
```

Or execute in pgAdmin/DBeaver:

1. Open `V2_0_0_Data_Migration.sql`
2. Select all and execute
3. Check the output for migration statistics

### Step 3: Update Application Code

Replace JSON blob usage with normalized tables:

**Before:**

```csharp
// ❌ OLD WAY - JSON blob
var log = new WorkoutLog
{
    ExercisesCompleted = JsonSerializer.Serialize(exercises)
};
```

**After:**

```csharp
// ✅ NEW WAY - Normalized table
var log = new WorkoutLog { UserId = userId };
_context.WorkoutLogs.Add(log);
await _context.SaveChangesAsync();

foreach (var exercise in exercises)
{
    _context.WorkoutLogExercises.Add(new WorkoutLogExercise
    {
        LogId = log.LogId,
        ExerciseId = exercise.ExerciseId,
        // ... other fields
    });
}
await _context.SaveChangesAsync();
```

See [`WorkoutLogServiceExample.cs`](../../Core/Service/Examples/WorkoutLogServiceExample.cs) for full examples.

---

## 📊 New Tables Reference

### 1. `workout_log_exercises` - Normalized Exercise Tracking

**Purpose:** Replaces JSON blob for queryable exercise data

**Key Columns:**

- `log_id` → Links to `workout_logs`
- `exercise_id` → Links to `exercises`
- `sets_completed`, `reps_per_set`, `weight_per_set`
- `total_volume` → Pre-computed for analytics
- `is_personal_record` → Flag for PRs
- `rpe` → Rate of Perceived Exertion (1-10)

**Use Cases:**

- Query user's workout performance
- Track personal records
- Analyze volume progression
- Generate ML training data

**Example Query:**

```sql
-- Get all personal records for a user
SELECT
    e.name AS exercise_name,
    wle.total_volume,
    wl.date AS achieved_date
FROM workout_log_exercises wle
JOIN exercises e ON wle.exercise_id = e.exercise_id
JOIN workout_logs wl ON wle.log_id = wl.log_id
WHERE wl.user_id = @userId AND wle.is_personal_record = TRUE
ORDER BY wl.date DESC;
```

---

### 2. `achievements` + `user_achievements` - Achievement System

**Purpose:** Replaces JSON array for trackable achievements

**Achievements Table:**

- `code` → Unique identifier (e.g., "WORKOUTS_100")
- `name`, `description` → Display text
- `category` → workout, nutrition, consistency, social
- `threshold_value` → Goal (e.g., 100 for "100 workouts")
- `token_reward`, `xp_reward` → Rewards

**User Achievements Table:**

- `user_id` → Who earned it
- `achievement_id` → What achievement
- `current_progress` → Progress toward threshold
- `is_earned` → Completed?
- `reward_claimed` → Has user claimed reward?

**Pre-seeded Achievements:**

- `FIRST_WORKOUT` - Complete first workout
- `WORKOUTS_10` - Complete 10 workouts
- `WORKOUTS_50` - Complete 50 workouts (rare)
- `STREAK_7` - 7-day workout streak
- `STREAK_30` - 30-day streak (rare)
- `FIRST_PR` - Set first personal record

**Example Query:**

```csharp
// Get user's earned achievements
var achievements = await _context.UserAchievements
    .Where(ua => ua.UserId == userId && ua.IsEarned)
    .Include(ua => ua.Achievement)
    .Select(ua => new {
        ua.Achievement.Name,
        ua.EarnedAt,
        ua.Achievement.TokenReward
    })
    .ToListAsync();
```

---

### 3. `user_feature_snapshots` - ML Feature Store

**Purpose:** Pre-computed features for ML training and inference

**50+ Feature Columns Including:**

| Category           | Features                                                              |
| ------------------ | --------------------------------------------------------------------- |
| **Demographics**   | age, gender, height_cm, weight_kg, bmi                                |
| **Fitness Level**  | fitness_level, body_fat_percentage, muscle_mass_kg                    |
| **Activity (30d)** | workouts_last_30_days, total_minutes, avg_duration, consistency_score |
| **Strength**       | bench_press_max, squat_max, deadlift_max, volume_progression_rate     |
| **Preferences**    | preferred_workout_time, favorite_exercise_ids                         |
| **AI Interaction** | ai_plans_generated, ai_acceptance_rate                                |

**Key Design:**

- `is_latest = TRUE` → Current snapshot (use filtered index)
- `feature_version` → Allows feature evolution (v1, v2, etc.)
- `valid_until` → When to recompute (weekly recommended)
- `computed_at` → Temporal tracking

**Usage:**

```csharp
// Get latest feature snapshot for ML inference
var features = await _context.UserFeatureSnapshots
    .Where(ufs => ufs.UserId == userId && ufs.IsLatest)
    .FirstOrDefaultAsync();

if (features == null || features.ValidUntil < DateTime.UtcNow)
{
    // Recompute features
    features = await ComputeUserFeatureSnapshot(userId);
}
```

---

### 4. `ai_model_versions` - Model Registry

**Purpose:** Track and A/B test ML model versions

**Key Columns:**

- `model_name` → e.g., "workout_generator"
- `version` → e.g., "v2.1.0"
- `traffic_percentage` → A/B test allocation (0-100)
- `is_active` → Receiving traffic?
- `is_default` → Fallback model
- `accuracy`, `f1_score` → Evaluation metrics
- `average_latency_ms` → Performance

**A/B Testing Flow:**

1. Deploy new model with `traffic_percentage = 10`
2. Monitor inference logs
3. Compare acceptance rates
4. Gradually increase traffic to winner
5. Set `is_default = TRUE` when confident

**Example:**

```csharp
// Get active model for inference
var model = await _context.AiModelVersions
    .Where(m => m.ModelName == "workout_generator" && m.IsActive)
    .OrderByDescending(m => m.TrafficPercentage)
    .FirstOrDefaultAsync();
```

---

### 5. `ai_inference_logs` - Inference Logging

**Purpose:** Log every AI call for monitoring and feedback

**Key Columns:**

- `user_id` → Who requested
- `model_version_id` → Which model
- `feature_snapshot_id` → Input features
- `inference_type` → workout_generation, classification, etc.
- `latency_ms` → Performance metric
- `user_rating` (1-5) → User feedback
- `was_accepted` → Did user use the output?
- `tokens_used` → For LLM cost tracking

**Use Cases:**

- Monitor model latency
- A/B test model versions
- Collect feedback for retraining
- Debug production issues
- Cost tracking (tokens)

**Example - A/B Test Comparison:**

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
ORDER BY acceptance_rate DESC;
```

---

### 6. `vector_embeddings` - Semantic Search

**Purpose:** Store embeddings for semantic search (requires pgvector)

**Key Columns:**

- `content_type` → exercise, workout_plan, knowledge, etc.
- `content_id` → ID of the content
- `embedding` → vector(1536) - pgvector type
- `source_text` → Original text
- `embedding_model` → e.g., "text-embedding-ada-002"

**Setup pgvector:**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE vector_embeddings ADD COLUMN embedding vector(1536);
CREATE INDEX ON vector_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Use Case - Find Similar Exercises:**

```sql
-- Find exercises similar to user's query
SELECT
    e.name,
    1 - (ve.embedding <=> @query_embedding) AS similarity
FROM vector_embeddings ve
JOIN exercises e ON ve.content_type = 'exercise' AND ve.content_id = e.exercise_id
ORDER BY ve.embedding <=> @query_embedding
LIMIT 10;
```

---

### 7. `fitness_knowledge` - RAG Knowledge Base

**Purpose:** Knowledge base for AI to retrieve context (RAG pattern)

**Key Columns:**

- `category` → exercise_technique, nutrition, recovery, injury_prevention
- `title`, `content` → Knowledge document
- `tags`, `muscle_groups`, `fitness_levels` → Arrays for filtering
- `priority` → Ranking for retrieval

**Use Case - RAG Query:**

```csharp
// Retrieve relevant knowledge for AI context
var context = await _context.FitnessKnowledge
    .Where(fk => fk.Category == "exercise_technique"
              && fk.MuscleGroups.Contains("chest")
              && fk.IsActive)
    .OrderByDescending(fk => fk.Priority)
    .Take(5)
    .ToListAsync();

// Add to LLM prompt
var prompt = $"Context: {string.Join("\n", context.Select(c => c.Content))}\n\nUser Question: ...";
```

---

## 🔄 Migration Checklist

### ✅ Completed

- [x] Schema migration generated
- [x] Database updated with 9 new tables
- [x] Data migration script created
- [x] Example service code provided
- [x] Documentation written

### ⏳ Pending (Next Steps)

- [ ] **Run data migration** - Execute `V2_0_0_Data_Migration.sql`
- [ ] **Update WorkoutLogService** - Migrate from JSON to normalized tables
- [ ] **Update AchievementService** - Use `user_achievements` table
- [ ] **Install pgvector** - For semantic search (optional)
- [ ] **Create feature computation job** - Daily batch to update `user_feature_snapshots`
- [ ] **Implement ML inference logging** - Log every AI call
- [ ] **Deploy first AI model** - Add to `ai_model_versions`
- [ ] **Seed knowledge base** - Add fitness content to `fitness_knowledge`

---

## 📖 Code Examples

### Example 1: Create Workout with Normalized Exercises

```csharp
public async Task<WorkoutLog> CreateWorkout(int userId, CreateWorkoutDto dto)
{
    // Create workout log
    var log = new WorkoutLog
    {
        UserId = userId,
        Date = DateTime.UtcNow,
        OverallRpe = dto.OverallRpe,
        Location = dto.Location
    };

    _context.WorkoutLogs.Add(log);
    await _context.SaveChangesAsync(); // Get LogId

    // Add exercises
    var order = 1;
    foreach (var exercise in dto.Exercises)
    {
        _context.WorkoutLogExercises.Add(new WorkoutLogExercise
        {
            LogId = log.LogId,
            ExerciseId = exercise.ExerciseId,
            OrderPerformed = order++,
            SetsCompleted = exercise.Sets,
            RepsPerSet = string.Join(",", exercise.Reps),
            WeightPerSet = string.Join(",", exercise.Weights),
            TotalVolume = exercise.Sets * exercise.Reps.Average() * exercise.Weights.Average(),
            Rpe = exercise.Rpe
        });
    }

    await _context.SaveChangesAsync();
    return log;
}
```

### Example 2: Query Workout Performance

```csharp
public async Task<WorkoutStatsDto> GetWorkoutStats(int userId, int months = 3)
{
    var startDate = DateTime.UtcNow.AddMonths(-months);

    var stats = await _context.WorkoutLogExercises
        .Where(wle => wle.WorkoutLog.UserId == userId
                   && wle.WorkoutLog.Date >= startDate)
        .GroupBy(wle => 1)
        .Select(g => new WorkoutStatsDto
        {
            TotalWorkouts = g.Select(wle => wle.LogId).Distinct().Count(),
            TotalVolume = g.Sum(wle => wle.TotalVolume ?? 0),
            PersonalRecords = g.Count(wle => wle.IsPersonalRecord),
            AverageRpe = (int)g.Average(wle => wle.Rpe ?? 0),
            MostFrequentExerciseId = g.GroupBy(wle => wle.ExerciseId)
                                      .OrderByDescending(ex => ex.Count())
                                      .Select(ex => ex.Key)
                                      .FirstOrDefault()
        })
        .FirstOrDefaultAsync();

    return stats ?? new WorkoutStatsDto();
}
```

### Example 3: Log AI Inference

```csharp
public async Task<WorkoutPlanDto> GenerateWorkoutPlan(int userId)
{
    // Get latest feature snapshot
    var features = await _context.UserFeatureSnapshots
        .Where(f => f.UserId == userId && f.IsLatest)
        .FirstOrDefaultAsync();

    // Get active model
    var model = await _context.AiModelVersions
        .Where(m => m.ModelName == "workout_generator" && m.IsActive)
        .FirstOrDefaultAsync();

    var startTime = DateTime.UtcNow;

    // Call ML model
    var plan = await _mlService.GenerateWorkoutPlan(features);

    var latencyMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;

    // Log inference
    _context.AiInferenceLogs.Add(new AiInferenceLog
    {
        UserId = userId,
        ModelVersionId = model.ModelVersionId,
        InferenceType = "workout_generation",
        FeatureSnapshotId = features.SnapshotId,
        OutputResult = JsonSerializer.Serialize(plan),
        LatencyMs = latencyMs,
        IsSuccess = true
    });

    await _context.SaveChangesAsync();
    return plan;
}
```

---

## 🔍 Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** The migration has already been applied. Check with:

```sql
SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 5;
```

### Issue: Data migration shows 0 records migrated

**Possible causes:**

1. No existing workout logs with `ExercisesCompleted` data
2. JSON format doesn't match expected structure
3. Migration already ran previously

**Check:**

```sql
-- Check workout logs with JSON data
SELECT COUNT(*) FROM workout_logs
WHERE "ExercisesCompleted" IS NOT NULL AND "ExercisesCompleted" != '[]';

-- Check if already migrated
SELECT COUNT(*) FROM workout_log_exercises;
```

### Issue: pgvector not available

**Solution:** Install pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

If extension not available, install from [pgvector GitHub](https://github.com/pgvector/pgvector).

---

## 📚 Additional Resources

- **ERD Diagram:** See [`DATABASE_ARCHITECTURE_ERD.md`](DATABASE_ARCHITECTURE_ERD.md)
- **SQL Migration:** See [`V2_0_0_AI_ML_Architecture.sql`](V2_0_0_AI_ML_Architecture.sql)
- **Data Migration:** See [`V2_0_0_Data_Migration.sql`](V2_0_0_Data_Migration.sql)
- **Code Examples:** See [`WorkoutLogServiceExample.cs`](../../Core/Service/Examples/WorkoutLogServiceExample.cs)

---

## 📞 Support

If you encounter issues during migration, check:

1. Database connection string in `appsettings.Development.json`
2. PostgreSQL version (12+ required for pgvector)
3. EF Core migration history
4. Console output for error messages

---

**Last Updated:** January 29, 2026  
**Version:** 2.0.0  
**Database:** PulseGym_v1.0.1 (PostgreSQL)
