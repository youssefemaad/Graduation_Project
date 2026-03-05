using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// AI-learned strength levels per user per exercise
    /// Updated automatically from workout feedback
    /// Used to provide smart weight recommendations in generated plans
    /// </summary>
    public class UserStrengthProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ExerciseId { get; set; }

        /// <summary>
        /// Estimated one-rep max in kg (calculated from feedback and workout logs)
        /// </summary>
        public decimal Estimated1RM { get; set; }

        /// <summary>
        /// AI confidence in the 1RM estimate (0.0-1.0)
        /// Increases when user marks weights as "Perfect"
        /// Decreases when adjustments are needed
        /// </summary>
        public decimal ConfidenceScore { get; set; } = 0.50m;

        /// <summary>
        /// Average weight used in working sets
        /// </summary>
        public decimal? AvgWorkingWeight { get; set; }

        /// <summary>
        /// Maximum weight ever lifted by user for this exercise
        /// </summary>
        public decimal? MaxWeightLifted { get; set; }

        /// <summary>
        /// Number of feedback submissions for this exercise
        /// More feedback = higher confidence
        /// </summary>
        public int FeedbackCount { get; set; } = 0;

        /// <summary>
        /// Last workout date for this exercise
        /// </summary>
        public DateTime? LastWorkoutDate { get; set; }

        /// <summary>
        /// Strength trend: Increasing, Stable, Decreasing
        /// </summary>
        public string? StrengthTrend { get; set; }

        /// <summary>
        /// Source of last update: Feedback, Manual, InBody, etc.
        /// </summary>
        public string? LastUpdatedFrom { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Exercise Exercise { get; set; } = null!;
    }
}
