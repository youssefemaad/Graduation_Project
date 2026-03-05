-- =============================================
-- AI/ML Database Schema Updates
-- IntelliFit Platform - Graduation Project
-- =============================================


-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
-- NOTE: We use `sentence-transformers/all-MiniLM-L6-v2` for embeddings by default
-- which produces 384-dimensional vectors. The `Embedding` columns and indexes
-- in this file are configured for 384 dimensions. If you choose a different
-- embedding model, update the `vector(384)` declarations accordingly.

-- =============================================
-- Add Vector Embeddings Support
-- =============================================

-- Add embedding column to Exercises table
ALTER TABLE "Exercises" 
ADD COLUMN IF NOT EXISTS "Embedding" vector(384);

-- Add embedding column to Meals table (if exists)
ALTER TABLE "Meals" 
ADD COLUMN IF NOT EXISTS "Embedding" vector(384);

-- =============================================
-- Create AI/ML Related Tables
-- =============================================

-- Table: MLModelVersions
-- Tracks different versions of ML models
CREATE TABLE IF NOT EXISTS "MLModelVersions" (
    "Id" SERIAL PRIMARY KEY,
    "ModelName" VARCHAR(100) NOT NULL,
    "Version" VARCHAR(50) NOT NULL,
    "FilePath" VARCHAR(500) NOT NULL,
    "ModelType" VARCHAR(50) NOT NULL, -- 'Workout', 'Nutrition', 'TensorFlow'
    "Framework" VARCHAR(50) NOT NULL, -- 'MLNet', 'TensorFlow', 'PyTorch'
    "Accuracy" DECIMAL(5,4),
    "TrainedDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "IsActive" BOOLEAN NOT NULL DEFAULT FALSE,
    "Metrics" JSONB, -- Store training metrics as JSON
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_ModelName_Version" UNIQUE ("ModelName", "Version")
);

-- Table: UserWorkoutHistory
-- Stores completed workouts for ML feedback loop
CREATE TABLE IF NOT EXISTS "UserWorkoutHistory" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "WorkoutPlanId" INTEGER,
    "ExerciseId" INTEGER NOT NULL,
    "CompletedDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "SetsCompleted" INTEGER,
    "RepsCompleted" INTEGER,
    "WeightUsed" DECIMAL(6,2),
    "DurationMinutes" INTEGER,
    "DifficultyRating" INTEGER CHECK ("DifficultyRating" BETWEEN 1 AND 5),
    "FatigueLevel" INTEGER CHECK ("FatigueLevel" BETWEEN 1 AND 5),
    "Feedback" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("WorkoutPlanId") REFERENCES "WorkoutPlans"("Id") ON DELETE SET NULL,
    FOREIGN KEY ("ExerciseId") REFERENCES "Exercises"("Id") ON DELETE CASCADE
);

-- Table: UserNutritionFeedback
-- Stores nutrition plan adherence for ML improvements
CREATE TABLE IF NOT EXISTS "UserNutritionFeedback" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "NutritionPlanId" INTEGER,
    "Date" DATE NOT NULL,
    "AdherenceScore" DECIMAL(3,2) CHECK ("AdherenceScore" BETWEEN 0 AND 1),
    "CaloriesConsumed" INTEGER,
    "ProteinConsumed" DECIMAL(6,2),
    "CarbsConsumed" DECIMAL(6,2),
    "FatsConsumed" DECIMAL(6,2),
    "HungerLevel" INTEGER CHECK ("HungerLevel" BETWEEN 1 AND 5),
    "EnergyLevel" INTEGER CHECK ("EnergyLevel" BETWEEN 1 AND 5),
    "SatisfactionRating" INTEGER CHECK ("SatisfactionRating" BETWEEN 1 AND 5),
    "Feedback" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("NutritionPlanId") REFERENCES "NutritionPlans"("Id") ON DELETE SET NULL
);

-- Table: AIRecommendations
-- Logs all AI-generated recommendations for analysis
CREATE TABLE IF NOT EXISTS "AIRecommendations" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "RecommendationType" VARCHAR(50) NOT NULL, -- 'Workout', 'Nutrition', 'Exercise'
    "ModelVersionId" INTEGER,
    "InputData" JSONB NOT NULL, -- User profile data used for prediction
    "Prediction" JSONB NOT NULL, -- Model predictions
    "Confidence" DECIMAL(5,4),
    "AcceptedByUser" BOOLEAN,
    "UserFeedbackScore" INTEGER CHECK ("UserFeedbackScore" BETWEEN 1 AND 5),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY ("ModelVersionId") REFERENCES "MLModelVersions"("Id") ON DELETE SET NULL
);

-- Table: ExerciseEmbeddings (Alternative approach)
-- Separate table for embeddings if preferred
CREATE TABLE IF NOT EXISTS "ExerciseEmbeddings" (
    "ExerciseId" INTEGER PRIMARY KEY,
    "Embedding" vector(384) NOT NULL,
    "EmbeddingModel" VARCHAR(100) NOT NULL,
    "GeneratedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("ExerciseId") REFERENCES "Exercises"("Id") ON DELETE CASCADE
);

-- Table: MealEmbeddings (Alternative approach)
CREATE TABLE IF NOT EXISTS "MealEmbeddings" (
    "MealId" INTEGER PRIMARY KEY,
    "Embedding" vector(384) NOT NULL,
    "EmbeddingModel" VARCHAR(100) NOT NULL,
    "GeneratedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("MealId") REFERENCES "Meals"("Id") ON DELETE CASCADE
);

-- =============================================
-- Create Indexes for Performance
-- =============================================

-- Vector similarity indexes (IVFFlat for better performance)
-- Note: Requires sufficient data before creating IVFFlat index
CREATE INDEX IF NOT EXISTS "idx_exercises_embedding" 
ON "Exercises" USING ivfflat ("Embedding" vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS "idx_meals_embedding" 
ON "Meals" USING ivfflat ("Embedding" vector_cosine_ops)
WITH (lists = 100);

-- Standard indexes
CREATE INDEX IF NOT EXISTS "idx_user_workout_history_user" 
ON "UserWorkoutHistory"("UserId", "CompletedDate" DESC);

CREATE INDEX IF NOT EXISTS "idx_user_nutrition_feedback_user" 
ON "UserNutritionFeedback"("UserId", "Date" DESC);

CREATE INDEX IF NOT EXISTS "idx_ai_recommendations_user" 
ON "AIRecommendations"("UserId", "CreatedAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_ml_model_versions_active" 
ON "MLModelVersions"("ModelName", "IsActive") WHERE "IsActive" = TRUE;

-- =============================================
-- Create Views for Analytics
-- =============================================

-- View: User Workout Statistics
CREATE OR REPLACE VIEW "vw_UserWorkoutStats" AS
SELECT 
    u."Id" as "UserId",
    u."Email",
    COUNT(DISTINCT uwh."Id") as "TotalWorkouts",
    COUNT(DISTINCT uwh."ExerciseId") as "UniqueExercises",
    AVG(uwh."DifficultyRating") as "AvgDifficultyRating",
    AVG(uwh."FatigueLevel") as "AvgFatigueLevel",
    SUM(uwh."DurationMinutes") as "TotalMinutesWorked",
    MAX(uwh."CompletedDate") as "LastWorkoutDate"
FROM "Users" u
LEFT JOIN "UserWorkoutHistory" uwh ON u."Id" = uwh."UserId"
GROUP BY u."Id", u."Email";

-- View: Nutrition Plan Adherence
CREATE OR REPLACE VIEW "vw_NutritionAdherence" AS
SELECT 
    u."Id" as "UserId",
    u."Email",
    AVG(unf."AdherenceScore") as "AvgAdherenceScore",
    AVG(unf."SatisfactionRating") as "AvgSatisfaction",
    AVG(unf."EnergyLevel") as "AvgEnergyLevel",
    COUNT(DISTINCT unf."Date") as "DaysTracked",
    MAX(unf."Date") as "LastTrackedDate"
FROM "Users" u
LEFT JOIN "UserNutritionFeedback" unf ON u."Id" = unf."UserId"
GROUP BY u."Id", u."Email";

-- =============================================
-- Create Functions
-- =============================================

-- Function: Find similar exercises using vector search
CREATE OR REPLACE FUNCTION "fn_FindSimilarExercises"(
    p_embedding vector(384),
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    "ExerciseId" INTEGER,
    "Name" VARCHAR,
    "Description" TEXT,
    "Similarity" REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e."Id" as "ExerciseId",
        e."Name",
        e."Description",
        (1 - (e."Embedding" <=> p_embedding)) as "Similarity"
    FROM "Exercises" e
    WHERE e."Embedding" IS NOT NULL
    ORDER BY e."Embedding" <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get active ML model version
CREATE OR REPLACE FUNCTION "fn_GetActiveModelVersion"(
    p_model_name VARCHAR(100)
)
RETURNS TABLE (
    "Id" INTEGER,
    "Version" VARCHAR,
    "FilePath" VARCHAR,
    "Accuracy" DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m."Id",
        m."Version",
        m."FilePath",
        m."Accuracy"
    FROM "MLModelVersions" m
    WHERE m."ModelName" = p_model_name
      AND m."IsActive" = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Insert Sample ML Model Versions
-- =============================================

INSERT INTO "MLModelVersions" ("ModelName", "Version", "FilePath", "ModelType", "Framework", "Accuracy", "IsActive", "Notes")
VALUES 
    ('WorkoutRecommender', '1.0.0', './MLModels/workout_model.zip', 'Workout', 'MLNet', 0.8500, TRUE, 'Initial workout recommendation model'),
    ('NutritionPredictor', '1.0.0', './MLModels/nutrition_model.zip', 'Nutrition', 'MLNet', 0.9200, TRUE, 'Initial nutrition prediction model'),
    ('NutritionDeepLearning', '1.0.0', 'serving/nutrition_model/1/', 'Nutrition', 'TensorFlow', 0.9500, TRUE, 'Deep learning model for meal generation')
ON CONFLICT ("ModelName", "Version") DO NOTHING;

-- =============================================
-- Grants and Permissions
-- =============================================

-- Grant permissions (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- =============================================
-- Verification Queries
-- =============================================

-- Check if pgvector extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check exercises table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Exercises' AND column_name = 'Embedding';

-- Count exercises with embeddings
SELECT COUNT(*) as exercises_with_embeddings 
FROM "Exercises" 
WHERE "Embedding" IS NOT NULL;

-- Check ML model versions
SELECT * FROM "MLModelVersions" WHERE "IsActive" = TRUE;

COMMIT;
