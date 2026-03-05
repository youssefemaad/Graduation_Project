-- ============================================================
-- IntelliFit Database Schema Upgrade
-- Version: 2.0.0 - AI/ML Ready Architecture
-- Date: 2026-01-29
-- ============================================================
-- 
-- This migration adds:
-- 1. Normalized exercise logging (replaces JSON blob)
-- 2. Achievement system (replaces JSON in member_profiles)
-- 3. ML Feature Store (for training data)
-- 4. AI Model Versioning (for A/B testing)
-- 5. Vector Embeddings (for semantic search - requires pgvector)
-- 6. Fitness Knowledge Base (for RAG)
--
-- RUN ORDER: Execute in a transaction for atomicity
-- ============================================================

BEGIN;

-- ============================================================
-- 1. WORKOUT LOG EXERCISES (Normalized from JSON)
-- ============================================================
-- WHY: The current ExercisesCompleted JSON string cannot be queried,
-- indexed, or joined. This table enables:
-- - Exercise-level performance tracking
-- - Progress analytics per exercise
-- - ML training on individual exercise data
-- - Personal record detection

CREATE TABLE IF NOT EXISTS workout_log_exercises (
    workout_log_exercise_id SERIAL PRIMARY KEY,
    log_id INTEGER NOT NULL REFERENCES workout_logs(log_id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(exercise_id) ON DELETE RESTRICT,
    order_performed INTEGER NOT NULL DEFAULT 1,
    sets_completed INTEGER NOT NULL DEFAULT 0,
    reps_per_set VARCHAR(100),  -- "12,10,8" format for flexibility
    weight_per_set VARCHAR(100),  -- "100,100,105" in user's unit
    total_volume DECIMAL(12, 2),  -- Pre-computed for quick aggregation
    rest_seconds_between_sets INTEGER,
    duration_seconds INTEGER,  -- For timed exercises
    rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),  -- Rate of Perceived Exertion
    notes TEXT,
    is_personal_record BOOLEAN DEFAULT FALSE,
    planned_exercise_id INTEGER REFERENCES workout_plan_exercises(workout_plan_exercise_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_workout_log_exercises_log_id ON workout_log_exercises(log_id);
CREATE INDEX idx_workout_log_exercises_exercise_id ON workout_log_exercises(exercise_id);
CREATE INDEX idx_workout_log_exercises_pr ON workout_log_exercises(is_personal_record) WHERE is_personal_record = TRUE;
CREATE INDEX idx_workout_log_exercises_log_order ON workout_log_exercises(log_id, order_performed);

-- ============================================================
-- 2. ACHIEVEMENT SYSTEM (Normalized from JSON)
-- ============================================================
-- WHY: member_profiles.achievements stores JSON string "[]"
-- This prevents querying achievements across users and tracking progress.

CREATE TABLE IF NOT EXISTS achievements (
    achievement_id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,  -- workout, nutrition, consistency, social, milestone
    icon_url VARCHAR(500),
    token_reward INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 0,
    threshold_value INTEGER,  -- e.g., 10 for "10 workouts"
    is_secret BOOLEAN DEFAULT FALSE,
    rarity VARCHAR(20) DEFAULT 'common',  -- common, rare, epic, legendary
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS user_achievements (
    user_achievement_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(achievement_id) ON DELETE RESTRICT,
    current_progress INTEGER DEFAULT 0,
    is_earned BOOLEAN DEFAULT FALSE,
    earned_at TIMESTAMP WITH TIME ZONE,
    reward_claimed BOOLEAN DEFAULT FALSE,
    reward_claimed_at TIMESTAMP WITH TIME ZONE,
    is_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_earned ON user_achievements(user_id, is_earned);
CREATE INDEX idx_user_achievements_unclaimed ON user_achievements(reward_claimed) WHERE reward_claimed = FALSE AND is_earned = TRUE;

-- ============================================================
-- 3. ML FEATURE STORE
-- ============================================================
-- WHY: ML models need pre-computed features for training and inference.
-- Computing features on-the-fly is slow and error-prone.
-- This table stores snapshots of user features for:
-- - Consistent training/inference features
-- - Feature versioning
-- - Audit trail of what data led to predictions

CREATE TABLE IF NOT EXISTS user_feature_snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    feature_version VARCHAR(20) DEFAULT 'v1',
    
    -- Demographic features
    age INTEGER,
    gender VARCHAR(20),
    height_cm DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    bmi DECIMAL(4, 2),
    
    -- Fitness level features
    fitness_level VARCHAR(20),
    experience_years DECIMAL(4, 1),
    body_fat_percentage DECIMAL(5, 2),
    muscle_mass_kg DECIMAL(5, 2),
    
    -- Activity features (rolling 30 days)
    workouts_last_30_days INTEGER DEFAULT 0,
    total_minutes_last_30_days INTEGER DEFAULT 0,
    total_calories_last_30_days INTEGER DEFAULT 0,
    avg_workout_duration DECIMAL(6, 2) DEFAULT 0,
    workout_consistency_score DECIMAL(5, 2) DEFAULT 0,  -- 0-100
    
    -- Strength progression features
    bench_press_max DECIMAL(6, 2),
    squat_max DECIMAL(6, 2),
    deadlift_max DECIMAL(6, 2),
    overhead_press_max DECIMAL(6, 2),
    total_volume_last_week DECIMAL(12, 2) DEFAULT 0,
    volume_progression_rate DECIMAL(6, 3) DEFAULT 0,  -- % change week over week
    
    -- Preference features
    preferred_workout_time VARCHAR(20),  -- morning, afternoon, evening
    preferred_workout_days INTEGER,
    favorite_exercise_ids VARCHAR(100),  -- comma-separated top 5
    avoided_exercise_ids VARCHAR(100),
    
    -- Engagement features
    plan_completion_rate INTEGER DEFAULT 0,  -- 0-100
    average_feedback_rating INTEGER DEFAULT 0,  -- 1-5
    days_active INTEGER DEFAULT 0,
    last_workout_date DATE,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    
    -- AI interaction features
    total_ai_plans_generated INTEGER DEFAULT 0,
    ai_plans_accepted INTEGER DEFAULT 0,
    ai_plans_rejected INTEGER DEFAULT 0,
    ai_acceptance_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Metadata
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_latest BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_user_feature_snapshots_user_latest ON user_feature_snapshots(user_id, is_latest) WHERE is_latest = TRUE;
CREATE INDEX idx_user_feature_snapshots_user_time ON user_feature_snapshots(user_id, computed_at DESC);
CREATE INDEX idx_user_feature_snapshots_version ON user_feature_snapshots(feature_version);

-- ============================================================
-- 4. AI MODEL VERSIONING
-- ============================================================
-- WHY: Track which model generated which output for:
-- - A/B testing different model versions
-- - Rollback capability
-- - Performance monitoring
-- - Audit compliance

CREATE TABLE IF NOT EXISTS ai_model_versions (
    model_version_id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    model_path VARCHAR(500),
    hyper_parameters JSONB,
    
    -- Performance metrics
    accuracy DECIMAL(5, 4),
    precision_score DECIMAL(5, 4),
    recall DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    average_latency_ms DECIMAL(8, 2),
    
    -- A/B testing
    traffic_percentage INTEGER DEFAULT 0 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Audit
    trained_at TIMESTAMP WITH TIME ZONE,
    deployed_at TIMESTAMP WITH TIME ZONE,
    retired_at TIMESTAMP WITH TIME ZONE,
    training_sample_count INTEGER,
    training_data_version VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_name, version)
);

CREATE INDEX idx_ai_model_versions_active ON ai_model_versions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ai_model_versions_default ON ai_model_versions(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_ai_model_versions_name ON ai_model_versions(model_name);

-- ============================================================
-- 5. AI INFERENCE LOGGING
-- ============================================================
-- WHY: Every AI call should be logged for:
-- - Monitoring latency and errors
-- - Collecting feedback for retraining
-- - Debugging production issues
-- - Compliance/audit requirements
-- Note: Use BIGSERIAL for high-volume logging

CREATE TABLE IF NOT EXISTS ai_inference_logs (
    inference_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    model_version_id INTEGER NOT NULL REFERENCES ai_model_versions(model_version_id) ON DELETE RESTRICT,
    inference_type VARCHAR(100) NOT NULL,  -- workout_generation, fitness_classification, etc.
    feature_snapshot_id INTEGER REFERENCES user_feature_snapshots(snapshot_id) ON DELETE SET NULL,
    input_features JSONB,
    output_result JSONB,
    confidence_scores JSONB,
    latency_ms INTEGER NOT NULL,
    tokens_used INTEGER,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    was_accepted BOOLEAN,
    user_feedback TEXT,
    error_message TEXT,
    is_success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for monitoring queries
CREATE INDEX idx_ai_inference_logs_user_time ON ai_inference_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_inference_logs_model_time ON ai_inference_logs(model_version_id, created_at DESC);
CREATE INDEX idx_ai_inference_logs_type ON ai_inference_logs(inference_type);
CREATE INDEX idx_ai_inference_logs_success ON ai_inference_logs(is_success);
CREATE INDEX idx_ai_inference_logs_time ON ai_inference_logs(created_at DESC);

-- Partition hint: Consider partitioning by created_at for high-volume production
-- CREATE TABLE ai_inference_logs_2026_01 PARTITION OF ai_inference_logs 
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- ============================================================
-- 6. VECTOR EMBEDDINGS (requires pgvector extension)
-- ============================================================
-- WHY: Enable semantic search for exercise recommendations
-- and RAG (Retrieval-Augmented Generation) for AI responses.
-- 
-- IMPORTANT: Install pgvector extension first:
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS vector_embeddings (
    embedding_id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,  -- exercise, workout_plan, knowledge_base, user_profile
    content_id INTEGER NOT NULL,
    source_text TEXT NOT NULL,
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_dimension INTEGER DEFAULT 1536,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_type, content_id)
);

CREATE INDEX idx_vector_embeddings_type_id ON vector_embeddings(content_type, content_id);
CREATE INDEX idx_vector_embeddings_model ON vector_embeddings(embedding_model);

-- After installing pgvector, run:
-- ALTER TABLE vector_embeddings ADD COLUMN embedding vector(1536);
-- CREATE INDEX ON vector_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- 7. FITNESS KNOWLEDGE BASE (for RAG)
-- ============================================================
-- WHY: Store fitness knowledge that AI can retrieve
-- to provide contextual, accurate responses.

CREATE TABLE IF NOT EXISTS fitness_knowledge (
    knowledge_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,  -- exercise_technique, nutrition, recovery, injury_prevention
    subcategory VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(50) DEFAULT 'expert_guideline',  -- research_paper, coach_created
    tags TEXT[],
    muscle_groups TEXT[],
    fitness_levels TEXT[],
    priority DECIMAL(3, 2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    approved_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fitness_knowledge_category ON fitness_knowledge(category);
CREATE INDEX idx_fitness_knowledge_active ON fitness_knowledge(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_fitness_knowledge_priority ON fitness_knowledge(priority DESC);
CREATE INDEX idx_fitness_knowledge_tags ON fitness_knowledge USING GIN(tags);
CREATE INDEX idx_fitness_knowledge_muscles ON fitness_knowledge USING GIN(muscle_groups);

-- ============================================================
-- 8. ADD NEW COLUMNS TO EXISTING TABLES
-- ============================================================

-- Add UpdatedAt and Location to workout_logs
ALTER TABLE workout_logs 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS overall_rpe INTEGER CHECK (overall_rpe >= 1 AND overall_rpe <= 10),
    ADD COLUMN IF NOT EXISTS location VARCHAR(50);

-- ============================================================
-- 9. SEED DATA FOR ACHIEVEMENTS
-- ============================================================

INSERT INTO achievements (code, name, description, category, token_reward, xp_reward, threshold_value, rarity) VALUES
-- Workout achievements
('FIRST_WORKOUT', 'First Steps', 'Complete your first workout', 'workout', 10, 50, 1, 'common'),
('WORKOUTS_10', 'Getting Started', 'Complete 10 workouts', 'workout', 25, 100, 10, 'common'),
('WORKOUTS_50', 'Dedicated', 'Complete 50 workouts', 'workout', 50, 250, 50, 'rare'),
('WORKOUTS_100', 'Century Club', 'Complete 100 workouts', 'workout', 100, 500, 100, 'epic'),
('WORKOUTS_500', 'Iron Will', 'Complete 500 workouts', 'workout', 250, 1000, 500, 'legendary'),

-- Consistency achievements
('STREAK_7', 'Week Warrior', 'Maintain a 7-day workout streak', 'consistency', 20, 75, 7, 'common'),
('STREAK_30', 'Monthly Master', 'Maintain a 30-day workout streak', 'consistency', 75, 200, 30, 'rare'),
('STREAK_100', 'Unstoppable', 'Maintain a 100-day workout streak', 'consistency', 200, 500, 100, 'legendary'),

-- Milestone achievements
('WEIGHT_GOAL', 'Goal Crusher', 'Reach your target weight', 'milestone', 100, 300, NULL, 'epic'),
('FIRST_PR', 'Personal Best', 'Set your first personal record', 'milestone', 15, 50, 1, 'common'),
('PR_10', 'Record Breaker', 'Set 10 personal records', 'milestone', 50, 150, 10, 'rare'),

-- Social achievements
('FIRST_REVIEW', 'Helpful Critic', 'Leave your first coach review', 'social', 5, 25, 1, 'common'),
('COACH_SESSION', 'Learning', 'Complete a session with a coach', 'social', 10, 50, 1, 'common')
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- ============================================================
-- POST-MIGRATION NOTES
-- ============================================================
-- 
-- 1. DATA MIGRATION: Migrate existing JSON data from:
--    - workout_logs.exercises_completed → workout_log_exercises
--    - member_profiles.achievements → user_achievements
--    Run separate migration scripts for data transformation.
--
-- 2. PGVECTOR: If using semantic search, install pgvector:
--    CREATE EXTENSION IF NOT EXISTS vector;
--    ALTER TABLE vector_embeddings ADD COLUMN embedding vector(1536);
--
-- 3. PARTITIONING: For high-volume tables (ai_inference_logs),
--    consider implementing table partitioning by date.
--
-- 4. FEATURE COMPUTATION: Set up a scheduled job to compute
--    user_feature_snapshots daily for active users.
--
-- 5. UPDATE EF CORE: After running this migration, run:
--    dotnet ef migrations add AddAIMLTables
-- ============================================================
