using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Shared.DTOs.WorkoutAI;

// ============================================================
// ML SERVICE REQUEST/RESPONSE MODELS
// These models mirror the Python FastAPI Pydantic models
// ============================================================

#region ML Service Models

/// <summary>
/// Request payload for workout plan generation (matches Python PredictionRequest)
/// </summary>
public class MLWorkoutRequest
{
    [JsonPropertyName("user_id")]
    public int UserId { get; set; }

    [JsonPropertyName("fitness_level")]
    public string FitnessLevel { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced

    [JsonPropertyName("goal")]
    public string Goal { get; set; } = "Muscle"; // Muscle, Strength, WeightLoss, Endurance

    [JsonPropertyName("days_per_week")]
    public int DaysPerWeek { get; set; } = 4;

    [JsonPropertyName("equipment")]
    public List<string> Equipment { get; set; } = new();

    [JsonPropertyName("injuries")]
    public List<string> Injuries { get; set; } = new();

    [JsonPropertyName("user_context")]
    public MLUserContext? UserContext { get; set; }
}

/// <summary>
/// User context for personalization (matches Python UserContext)
/// </summary>
public class MLUserContext
{
    [JsonPropertyName("inbody_data")]
    public MLInBodyData? InBodyData { get; set; }

    [JsonPropertyName("muscle_scan")]
    public MLMuscleScanData? MuscleScan { get; set; }

    [JsonPropertyName("strength_profile")]
    public List<MLStrengthProfileEntry>? StrengthProfile { get; set; }

    [JsonPropertyName("feedback_summary")]
    public MLFeedbackSummary? FeedbackSummary { get; set; }
}

/// <summary>
/// InBody measurement data (matches Python InBodyData)
/// </summary>
public class MLInBodyData
{
    [JsonPropertyName("muscle_mass_kg")]
    public decimal? MuscleMassKg { get; set; }

    [JsonPropertyName("body_fat_percent")]
    public decimal? BodyFatPercent { get; set; }

    [JsonPropertyName("skeletal_muscle_mass")]
    public decimal? SkeletalMuscleMass { get; set; }
}

/// <summary>
/// Muscle scan results (matches Python MuscleScanData)
/// </summary>
public class MLMuscleScanData
{
    [JsonPropertyName("weak_areas")]
    public List<string>? WeakAreas { get; set; }

    [JsonPropertyName("strong_areas")]
    public List<string>? StrongAreas { get; set; }
}

/// <summary>
/// Strength profile entry (matches Python StrengthProfileData)
/// </summary>
public class MLStrengthProfileEntry
{
    [JsonPropertyName("exercise_name")]
    public string ExerciseName { get; set; } = null!;

    [JsonPropertyName("one_rm_kg")]
    public decimal OneRmKg { get; set; }

    [JsonPropertyName("confidence_score")]
    public decimal ConfidenceScore { get; set; }
}

/// <summary>
/// Feedback summary (matches Python FeedbackSummary)
/// </summary>
public class MLFeedbackSummary
{
    [JsonPropertyName("avg_rating")]
    public decimal? AvgRating { get; set; }

    [JsonPropertyName("weight_adjustments")]
    public Dictionary<string, string>? WeightAdjustments { get; set; }
}

/// <summary>
/// Response from ML service (matches Python PredictionResponse)
/// </summary>
public class MLWorkoutResponse
{
    [JsonPropertyName("plan")]
    public Dictionary<string, object>? Plan { get; set; }

    [JsonPropertyName("is_valid_json")]
    public bool IsValidJson { get; set; }

    [JsonPropertyName("model_version")]
    public string? ModelVersion { get; set; }

    [JsonPropertyName("generation_latency_ms")]
    public int GenerationLatencyMs { get; set; }

    [JsonPropertyName("prompt_used")]
    public string? PromptUsed { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

/// <summary>
/// ML service health check response
/// </summary>
public class MLHealthResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = null!;

    [JsonPropertyName("model_version")]
    public string? ModelVersion { get; set; }

    [JsonPropertyName("device")]
    public string? Device { get; set; }

    [JsonPropertyName("timestamp")]
    public string? Timestamp { get; set; }
}

#endregion

// ============================================================
// API REQUEST/RESPONSE MODELS
// These models are used by the C# API controllers
// ============================================================

#region API Models

/// <summary>
/// Request to generate a new AI workout plan
/// </summary>
public class GenerateAIWorkoutPlanRequest
{
    public int UserId { get; set; }
    public string FitnessLevel { get; set; } = "Beginner";
    public string Goal { get; set; } = "Muscle";
    public int DaysPerWeek { get; set; } = 4;
    public List<string> Equipment { get; set; } = new();
    public List<string> Injuries { get; set; } = new();

    /// <summary>
    /// If true, include user's InBody, strength profile, and muscle scan data
    /// </summary>
    public bool IncludeUserContext { get; set; } = true;

    /// <summary>
    /// If true, skip cache and force regeneration
    /// </summary>
    public bool ForceRegenerate { get; set; } = false;
}

/// <summary>
/// Response with generated workout plan
/// </summary>
public class AIWorkoutPlanResult
{
    public bool Success { get; set; }
    public int? PlanId { get; set; }
    public string? PlanName { get; set; }
    public AIGeneratedPlanData? PlanData { get; set; }
    public string? ModelVersion { get; set; }
    public int GenerationLatencyMs { get; set; }
    public bool FromCache { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Structured workout plan data from AI
/// NOTE: No [JsonPropertyName] here - ASP.NET Core's CamelCase policy outputs camelCase to frontend.
/// Snake_case deserialization from ML is handled via SnakeCaseLower in ParsePlanData.
/// </summary>
public class AIGeneratedPlanData
{
    public string? Schedule { get; set; }
    public string? PlanName { get; set; }
    public string? FitnessLevel { get; set; }
    public string? Goal { get; set; }
    public int? DaysPerWeek { get; set; }
    public string? GeneratedAt { get; set; }
    public List<AIWorkoutDay>? Days { get; set; }
    public AIProgressiveOverload? ProgressiveOverload { get; set; }
    public List<string>? WeeklyTips { get; set; }
    public string? Notes { get; set; }
    public int? ProgramDurationWeeks { get; set; }
}

/// <summary>
/// Single workout day in the plan
/// </summary>
public class AIWorkoutDay
{
    public int DayNumber { get; set; }
    public string? DayName { get; set; }
    public string? Focus { get; set; }
    public List<string>? FocusAreas { get; set; }
    public List<AIExercise>? Exercises { get; set; }
    public int? EstimatedDurationMinutes { get; set; }
}

/// <summary>
/// Single exercise in the plan
/// </summary>
public class AIExercise
{
    public int? ExerciseId { get; set; }
    public string Name { get; set; } = null!;

    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public int? Sets { get; set; }

    public string? Reps { get; set; }
    public string? Rest { get; set; }
    public int? RestSeconds { get; set; }
    public decimal? WeightKg { get; set; }
    public string? WeightRecommendation { get; set; }
    public List<string>? TargetMuscles { get; set; }
    public string? Equipment { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Tempo { get; set; }
    public string? Notes { get; set; }
    public string? MovementPattern { get; set; }
    public string? ExerciseType { get; set; }
    public List<string>? Alternatives { get; set; }
}

/// <summary>
/// Progressive overload recommendations
/// </summary>
public class AIProgressiveOverload
{
    public string? Strategy { get; set; } // "Linear", "Double Progression", "Wave Loading"
    public decimal? WeeklyWeightIncreasePercent { get; set; }
    public string? DeloadSchedule { get; set; } // "Every 4th week"
    public string? Notes { get; set; }
}

#endregion

// ============================================================
// FEEDBACK MODELS
// These models are used for the AI learning feedback loop
// ============================================================

#region Feedback Models

/// <summary>
/// Submit feedback after completing a workout
/// </summary>
public class SubmitWorkoutFeedbackRequest
{
    public int WorkoutLogId { get; set; }
    public int? WorkoutPlanId { get; set; }

    /// <summary>
    /// Overall workout rating (1-5 stars)
    /// </summary>
    public int Rating { get; set; }

    /// <summary>
    /// Overall difficulty: TooEasy, Perfect, TooHard
    /// </summary>
    public string? DifficultyLevel { get; set; }

    /// <summary>
    /// Per-exercise feedback
    /// </summary>
    public List<ExerciseFeedbackDto> ExerciseFeedbacks { get; set; } = new();

    /// <summary>
    /// Free-text comments
    /// </summary>
    public string? Comments { get; set; }
}

/// <summary>
/// Feedback for a single exercise
/// </summary>
public class ExerciseFeedbackDto
{
    public int ExerciseId { get; set; }
    public string? ExerciseName { get; set; }
    public decimal? WeightUsed { get; set; }

    /// <summary>
    /// How the weight felt: TooLight, Perfect, TooHeavy
    /// </summary>
    public string WeightFeeling { get; set; } = "Perfect";

    public int SetsCompleted { get; set; }
    public int SetsPlanned { get; set; }

    /// <summary>
    /// Form quality: Poor, Fair, Good, Excellent
    /// </summary>
    public string? FormDifficulty { get; set; }
}

/// <summary>
/// Response after submitting feedback
/// </summary>
public class WorkoutFeedbackResult
{
    public bool Success { get; set; }
    public int FeedbackId { get; set; }
    public List<StrengthProfileUpdate>? StrengthUpdates { get; set; }
    public string? Message { get; set; }
}

/// <summary>
/// Update to user's strength profile based on feedback
/// </summary>
public class StrengthProfileUpdate
{
    public int ExerciseId { get; set; }
    public string ExerciseName { get; set; } = null!;
    public decimal OldEstimated1RM { get; set; }
    public decimal NewEstimated1RM { get; set; }
    public decimal ConfidenceChange { get; set; }
    public string Reason { get; set; } = null!; // "Weight felt TooLight", etc.
}

/// <summary>
/// User's strength profile summary for display
/// </summary>
public class UserStrengthProfileDto
{
    public int UserId { get; set; }
    public List<ExerciseStrengthDto> Exercises { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Strength data for a single exercise
/// </summary>
public class ExerciseStrengthDto
{
    public int ExerciseId { get; set; }
    public string ExerciseName { get; set; } = null!;
    public decimal Estimated1RM { get; set; }
    public decimal ConfidenceScore { get; set; }
    public decimal? AvgWorkingWeight { get; set; }
    public decimal? MaxWeightLifted { get; set; }
    public int FeedbackCount { get; set; }
    public string? StrengthTrend { get; set; }
    public DateTime? LastWorkoutDate { get; set; }
}

#endregion

// ============================================================
// MUSCLE SCAN MODELS
// ============================================================

#region Muscle Scan Models

/// <summary>
/// Submit a body photo for muscle analysis
/// </summary>
public class SubmitMuscleScanRequest
{
    public int UserId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public string ImageType { get; set; } = "FullBody"; // FullBody, Front, Back, Side
}

/// <summary>
/// Muscle development scan result
/// </summary>
public class MuscleScanResultDto
{
    public int ScanId { get; set; }
    public int UserId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public string ImageType { get; set; } = null!;
    public Dictionary<string, decimal>? MuscleScores { get; set; }
    public List<string>? UnderdevelopedMuscles { get; set; }
    public List<string>? WellDevelopedMuscles { get; set; }
    public decimal? BodyFatEstimate { get; set; }
    public decimal? MuscleDefinitionScore { get; set; }
    public string? PostureNotes { get; set; }
    public bool AsymmetryDetected { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public DateTime ScanDate { get; set; }
}

/// <summary>
/// Request to save AI-generated plan from frontend (after direct ML API call)
/// Used when frontend calls FastAPI directly and then saves result to backend
/// </summary>
public class SaveAIGeneratedPlanRequest
{
    public int UserId { get; set; }
    public string? PlanName { get; set; }
    public string? FitnessLevel { get; set; }
    public string? Goal { get; set; }
    public int DaysPerWeek { get; set; }
    public int ProgramDurationWeeks { get; set; }
    public List<WorkoutDayData> Days { get; set; } = new();
    public string? Notes { get; set; }
    public int GenerationLatencyMs { get; set; }
    public string? ModelVersion { get; set; }
    public bool AIGenerated { get; set; } = true;
}

/// <summary>
/// Workout day data structure
/// </summary>
public class WorkoutDayData
{
    public int DayNumber { get; set; }
    public string? DayName { get; set; }
    public List<string> FocusAreas { get; set; } = new();
    public int? EstimatedDurationMinutes { get; set; }
    public List<WorkoutExerciseData> Exercises { get; set; } = new();
}

/// <summary>
/// Exercise data structure
/// </summary>
public class WorkoutExerciseData
{
    public string Name { get; set; } = null!;

    [JsonConverter(typeof(FlexibleStringConverter))]
    public string? Sets { get; set; }

    [JsonConverter(typeof(FlexibleStringConverter))]
    public string? Reps { get; set; }

    [JsonConverter(typeof(FlexibleStringConverter))]
    public string? Rest { get; set; }

    public List<string>? TargetMuscles { get; set; }
    public string? Equipment { get; set; }
    public string? MovementPattern { get; set; }
    public string? ExerciseType { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Custom JSON converter that accepts both string and number JSON tokens
/// and deserializes them as a C# string. This is needed because the ML API
/// sometimes sends numeric fields (sets, reps) as JSON numbers instead of strings.
/// </summary>
public class FlexibleStringConverter : JsonConverter<string?>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.String => reader.GetString(),
            JsonTokenType.Number => reader.TryGetInt64(out var l) ? l.ToString() : reader.GetDecimal().ToString(),
            JsonTokenType.True => "true",
            JsonTokenType.False => "false",
            JsonTokenType.Null => null,
            _ => reader.GetString()
        };
    }

    public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value);
    }
}

/// <summary>
/// Response after saving plan
/// </summary>
public class SavePlanResponse
{
    public bool Success { get; set; }
    public int? PlanId { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// DTO for returning user's saved AI workout plans
/// </summary>
public class UserAIWorkoutPlanDto
{
    public int PlanId { get; set; }
    public string PlanName { get; set; } = null!;
    public string? Description { get; set; }
    public string? FitnessLevel { get; set; }
    public string? Goal { get; set; }
    public int? DaysPerWeek { get; set; }
    public int? DurationWeeks { get; set; }
    public string? PlanType { get; set; }
    public string Status { get; set; } = "Active";
    public bool IsActive { get; set; }
    public string? ModelVersion { get; set; }
    public int? GenerationLatencyMs { get; set; }
    public string? PlanData { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<UserAIPlanDayDto> Days { get; set; } = new();
}

/// <summary>
/// DTO for a day in the user's AI workout plan
/// </summary>
public class UserAIPlanDayDto
{
    public int DayNumber { get; set; }
    public string? DayName { get; set; }
    public List<UserAIPlanExerciseDto> Exercises { get; set; } = new();
}

/// <summary>
/// DTO for an exercise in the user's AI workout plan
/// </summary>
public class UserAIPlanExerciseDto
{
    public int WorkoutPlanExerciseId { get; set; }
    public int ExerciseId { get; set; }
    public string ExerciseName { get; set; } = null!;
    public int DayNumber { get; set; }
    public int OrderInDay { get; set; }
    public int? Sets { get; set; }
    public int? Reps { get; set; }
    public int? RestSeconds { get; set; }
    public string? Notes { get; set; }
    public int? EquipmentId { get; set; }
    public string? EquipmentRequired { get; set; }
    public string? MuscleGroup { get; set; }
}

#endregion

