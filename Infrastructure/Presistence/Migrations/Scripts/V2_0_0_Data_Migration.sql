-- ============================================================
-- IntelliFit Data Migration Script
-- Version: 2.0.0 - Migrate JSON Blobs to Normalized Tables
-- Date: 2026-01-29
-- ============================================================
--
-- This script migrates existing JSON data to the new normalized tables:
-- 1. workout_logs.exercises_completed → workout_log_exercises
-- 2. member_profiles.achievements → user_achievements
--
-- IMPORTANT: Run this AFTER applying the schema migration V2_0_0
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: Migrate WorkoutLog Exercises from JSON to Normalized Table
-- ============================================================

-- This migration handles the ExercisesCompleted JSON field in workout_logs
-- Expected JSON format: 
-- [
--   {
--     "ExerciseId": 1,
--     "SetsCompleted": 3,
--     "RepsPerSet": "12,10,8",
--     "WeightPerSet": "100,100,105",
--     "Rpe": 8,
--     "Notes": "Felt strong today"
--   }
-- ]

DO $$
DECLARE
    log_record RECORD;
    exercise_record JSONB;
    order_num INTEGER;
    total_sets INTEGER;
    total_reps NUMERIC;
    avg_weight NUMERIC;
    calculated_volume NUMERIC;
BEGIN
    -- Iterate through all workout logs that have exercises_completed data
    FOR log_record IN 
        SELECT 
            "LogId",
            "ExercisesCompleted"
        FROM workout_logs 
        WHERE "ExercisesCompleted" IS NOT NULL 
        AND "ExercisesCompleted" != '[]'
        AND "ExercisesCompleted" != ''
    LOOP
        -- Reset order counter for each workout log
        order_num := 1;
        
        -- Parse the JSON array and insert each exercise
        FOR exercise_record IN 
            SELECT * FROM jsonb_array_elements(log_record."ExercisesCompleted"::JSONB)
        LOOP
            -- Extract values from JSON
            total_sets := COALESCE((exercise_record->>'SetsCompleted')::INTEGER, 0);
            
            -- Calculate average reps if RepsPerSet is provided
            -- Example: "12,10,8" → avg = 10
            IF exercise_record->>'RepsPerSet' IS NOT NULL THEN
                SELECT AVG(reps::NUMERIC)
                INTO total_reps
                FROM unnest(string_to_array(exercise_record->>'RepsPerSet', ',')) AS reps;
            ELSE
                total_reps := NULL;
            END IF;
            
            -- Calculate average weight if WeightPerSet is provided
            IF exercise_record->>'WeightPerSet' IS NOT NULL THEN
                SELECT AVG(weight::NUMERIC)
                INTO avg_weight
                FROM unnest(string_to_array(exercise_record->>'WeightPerSet', ',')) AS weight;
            ELSE
                avg_weight := NULL;
            END IF;
            
            -- Calculate total volume: Sets × Reps × Weight
            IF total_sets IS NOT NULL AND total_reps IS NOT NULL AND avg_weight IS NOT NULL THEN
                calculated_volume := total_sets * total_reps * avg_weight;
            ELSE
                calculated_volume := NULL;
            END IF;
            
            -- Insert into normalized table
            INSERT INTO workout_log_exercises (
                "LogId",
                "ExerciseId",
                "OrderPerformed",
                "SetsCompleted",
                "RepsPerSet",
                "WeightPerSet",
                "TotalVolume",
                "Rpe",
                "Notes",
                "IsPersonalRecord",
                "CreatedAt"
            ) VALUES (
                log_record."LogId",
                (exercise_record->>'ExerciseId')::INTEGER,
                order_num,
                total_sets,
                exercise_record->>'RepsPerSet',
                exercise_record->>'WeightPerSet',
                calculated_volume,
                CASE 
                    WHEN exercise_record->>'Rpe' IS NOT NULL 
                    THEN (exercise_record->>'Rpe')::INTEGER 
                    ELSE NULL 
                END,
                exercise_record->>'Notes',
                COALESCE((exercise_record->>'IsPersonalRecord')::BOOLEAN, FALSE),
                COALESCE(
                    (SELECT "Date" FROM workout_logs WHERE "LogId" = log_record."LogId"),
                    NOW()
                )
            )
            ON CONFLICT DO NOTHING; -- Skip if already migrated
            
            -- Increment order for next exercise
            order_num := order_num + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Workout exercises migration completed successfully';
END $$;

-- ============================================================
-- PART 2: Migrate Member Profile Achievements from JSON
-- ============================================================

-- This migration handles the Achievements JSON field in member_profiles
-- Expected JSON format: ["FIRST_WORKOUT", "WORKOUTS_10", "STREAK_7"]
-- Or empty: "[]"

DO $$
DECLARE
    profile_record RECORD;
    achievement_code TEXT;
    achievement_id_var INTEGER;
BEGIN
    -- Iterate through all member profiles that have achievements
    FOR profile_record IN 
        SELECT 
            mp."MemberId",
            mp."Achievements",
            u."UserId"
        FROM member_profiles mp
        JOIN users u ON mp."MemberId" = u."UserId"
        WHERE mp."Achievements" IS NOT NULL 
        AND mp."Achievements" != '[]'
        AND mp."Achievements" != ''
    LOOP
        -- Parse the JSON array of achievement codes
        FOR achievement_code IN 
            SELECT jsonb_array_elements_text(profile_record."Achievements"::JSONB)
        LOOP
            -- Find the achievement ID by code
            SELECT "AchievementId" INTO achievement_id_var
            FROM achievements
            WHERE "Code" = achievement_code;
            
            -- Only insert if achievement exists in the achievements table
            IF achievement_id_var IS NOT NULL THEN
                INSERT INTO user_achievements (
                    "UserId",
                    "AchievementId",
                    "CurrentProgress",
                    "IsEarned",
                    "EarnedAt",
                    "RewardClaimed",
                    "IsNotified",
                    "CreatedAt",
                    "UpdatedAt"
                ) VALUES (
                    profile_record."UserId",
                    achievement_id_var,
                    100, -- Assume completed if it's in the JSON array
                    TRUE, -- Already earned
                    NOW(), -- Use current time since we don't have historical data
                    FALSE, -- Assume not claimed yet
                    FALSE, -- Not notified
                    NOW(),
                    NOW()
                )
                ON CONFLICT ("UserId", "AchievementId") DO NOTHING; -- Skip duplicates
            ELSE
                RAISE NOTICE 'Achievement code "%" not found in achievements table for user %', 
                    achievement_code, profile_record."UserId";
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Member achievements migration completed successfully';
END $$;

-- ============================================================
-- PART 3: Verification Queries
-- ============================================================

-- Count migrated workout log exercises
DO $$
DECLARE
    migrated_count INTEGER;
    original_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM workout_log_exercises;
    SELECT COUNT(*) INTO original_count FROM workout_logs 
    WHERE "ExercisesCompleted" IS NOT NULL AND "ExercisesCompleted" != '[]';
    
    RAISE NOTICE 'Migrated % workout log exercises from % workout logs', 
        migrated_count, original_count;
END $$;

-- Count migrated user achievements
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM user_achievements;
    RAISE NOTICE 'Migrated % user achievements', migrated_count;
END $$;

-- Show sample migrated data
SELECT 
    'Workout Log Exercises Sample' AS migration_check,
    COUNT(*) AS total_count,
    COUNT(DISTINCT "LogId") AS unique_logs,
    SUM("TotalVolume") AS total_volume_migrated
FROM workout_log_exercises;

SELECT 
    'User Achievements Sample' AS migration_check,
    COUNT(*) AS total_count,
    COUNT(DISTINCT "UserId") AS unique_users
FROM user_achievements;

COMMIT;

-- ============================================================
-- POST-MIGRATION NOTES
-- ============================================================
-- 
-- 1. VERIFICATION: Check the output of the verification queries
--    to ensure data was migrated correctly.
--
-- 2. APPLICATION UPDATE: Update your services to:
--    - Write to workout_log_exercises instead of JSON
--    - Read from workout_log_exercises for queries
--
-- 3. DEPRECATION WARNING: The ExercisesCompleted field is marked
--    [Obsolete] in C# code but not yet dropped from the database.
--    Keep it for rollback capability during transition period.
--
-- 4. FUTURE CLEANUP: After confirming everything works for 1-2 weeks:
--    ALTER TABLE workout_logs DROP COLUMN "ExercisesCompleted";
--    ALTER TABLE member_profiles DROP COLUMN "Achievements";
--
-- 5. PERSONAL RECORDS: Run a separate script to identify and mark
--    actual personal records based on historical max volume/weight.
-- ============================================================
