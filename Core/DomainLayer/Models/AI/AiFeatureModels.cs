using System;

namespace IntelliFit.Domain.Models.AI
{
    /// <summary>
    /// Stores computed features for ML model training and inference.
    /// Pre-computed features are stored here to avoid re-calculation at inference time.
    /// 
    /// WHY THIS EXISTS:
    /// - Feature computation can be expensive (aggregations, time-series calculations)
    /// - Ensures training and inference use identical feature calculations
    /// - Enables feature versioning for A/B testing different feature sets
    /// - Supports offline batch feature computation
    /// </summary>
    public class UserFeatureSnapshot
    {
        public int SnapshotId { get; set; }
        public int UserId { get; set; }

        /// <summary>
        /// Version of feature calculation logic (for reproducibility)
        /// </summary>
        public string FeatureVersion { get; set; } = "v1";

        // ========== DEMOGRAPHIC FEATURES ==========
        public int? Age { get; set; }
        public string? Gender { get; set; }
        public decimal? HeightCm { get; set; }
        public decimal? WeightKg { get; set; }
        public decimal? Bmi { get; set; }

        // ========== FITNESS LEVEL FEATURES ==========
        public string? FitnessLevel { get; set; }
        public decimal? ExperienceYears { get; set; }
        public decimal? BodyFatPercentage { get; set; }
        public decimal? MuscleMassKg { get; set; }

        // ========== ACTIVITY FEATURES (last 30 days) ==========
        public int WorkoutsLast30Days { get; set; }
        public int TotalMinutesLast30Days { get; set; }
        public int TotalCaloriesLast30Days { get; set; }
        public decimal AvgWorkoutDuration { get; set; }
        public decimal WorkoutConsistencyScore { get; set; } // 0-100

        // ========== STRENGTH PROGRESSION FEATURES ==========
        public decimal? BenchPressMax { get; set; }
        public decimal? SquatMax { get; set; }
        public decimal? DeadliftMax { get; set; }
        public decimal? OverheadPressMax { get; set; }
        public decimal TotalVolumeLastWeek { get; set; }
        public decimal VolumeProgressionRate { get; set; } // % change week over week

        // ========== PREFERENCE FEATURES ==========
        public string? PreferredWorkoutTime { get; set; } // morning/afternoon/evening
        public int? PreferredWorkoutDays { get; set; }
        public string? FavoriteExerciseIds { get; set; } // comma-separated top 5
        public string? AvoidedExerciseIds { get; set; } // injuries/preferences

        // ========== ENGAGEMENT FEATURES ==========
        public int PlanCompletionRate { get; set; } // 0-100
        public int AverageFeedbackRating { get; set; } // 1-5
        public int DaysActive { get; set; } // total days with activity
        public DateTime? LastWorkoutDate { get; set; }
        public int CurrentStreakDays { get; set; }
        public int LongestStreakDays { get; set; }

        // ========== AI INTERACTION FEATURES ==========
        public int TotalAiPlansGenerated { get; set; }
        public int AiPlansAccepted { get; set; }
        public int AiPlansRejected { get; set; }
        public decimal AiAcceptanceRate { get; set; }

        // ========== METADATA ==========
        public DateTime ComputedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ValidUntil { get; set; }
        public bool IsLatest { get; set; } = true;

        // Navigation
        public virtual User User { get; set; } = null!;
    }

    /// <summary>
    /// Tracks AI model versions and their performance metrics.
    /// Enables A/B testing and rollback capabilities.
    /// </summary>
    public class AiModelVersion
    {
        public int ModelVersionId { get; set; }
        public string ModelName { get; set; } = null!; // "workout_generator", "fitness_classifier"
        public string Version { get; set; } = null!; // "v1.2.0"
        public string? Description { get; set; }
        public string? ModelPath { get; set; } // Path to model file or API endpoint
        public string? HyperParameters { get; set; } // JSON of training params

        // ========== PERFORMANCE METRICS ==========
        public decimal? Accuracy { get; set; }
        public decimal? Precision { get; set; }
        public decimal? Recall { get; set; }
        public decimal? F1Score { get; set; }
        public decimal? AverageLatencyMs { get; set; }

        // ========== A/B TESTING ==========
        public int TrafficPercentage { get; set; } = 0; // 0-100
        public bool IsActive { get; set; } = false;
        public bool IsDefault { get; set; } = false;

        // ========== AUDIT ==========
        public DateTime TrainedAt { get; set; }
        public DateTime DeployedAt { get; set; }
        public DateTime? RetiredAt { get; set; }
        public int? TrainingSampleCount { get; set; }
        public string? TrainingDataVersion { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Logs AI inference requests for monitoring and retraining.
    /// Every AI call should be logged here.
    /// </summary>
    public class AiInferenceLog
    {
        public long InferenceId { get; set; } // Use long for high-volume logging
        public int? UserId { get; set; }
        public int ModelVersionId { get; set; }

        /// <summary>
        /// Type of inference: "workout_generation", "fitness_classification", "exercise_recommendation"
        /// </summary>
        public string InferenceType { get; set; } = null!;

        /// <summary>
        /// Feature snapshot ID used for this inference (for reproducibility)
        /// </summary>
        public int? FeatureSnapshotId { get; set; }

        /// <summary>
        /// Raw input features as JSON (for debugging/retraining)
        /// </summary>
        public string? InputFeatures { get; set; }

        /// <summary>
        /// Model output as JSON
        /// </summary>
        public string? OutputResult { get; set; }

        /// <summary>
        /// Confidence scores as JSON
        /// </summary>
        public string? ConfidenceScores { get; set; }

        /// <summary>
        /// Inference latency in milliseconds
        /// </summary>
        public int LatencyMs { get; set; }

        /// <summary>
        /// Tokens consumed (for LLM-based models)
        /// </summary>
        public int? TokensUsed { get; set; }

        /// <summary>
        /// User feedback on this inference (1-5, null if not rated)
        /// </summary>
        public int? UserRating { get; set; }

        /// <summary>
        /// Was the output accepted/used by the user?
        /// </summary>
        public bool? WasAccepted { get; set; }

        /// <summary>
        /// User's textual feedback
        /// </summary>
        public string? UserFeedback { get; set; }

        /// <summary>
        /// Any errors during inference
        /// </summary>
        public string? ErrorMessage { get; set; }
        public bool IsSuccess { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual User? User { get; set; }
        public virtual AiModelVersion ModelVersion { get; set; } = null!;
        public virtual UserFeatureSnapshot? FeatureSnapshot { get; set; }
    }
}
