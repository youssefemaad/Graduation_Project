using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Tracks individual exercise performance within a workout log session.
    /// This replaces the JSON string 'ExercisesCompleted' field for proper normalization.
    /// 
    /// WHY THIS EXISTS:
    /// - Enables querying individual exercise performance over time
    /// - Supports ML training on exercise progression data
    /// - Allows aggregation (total sets per week, volume trends)
    /// - Maintains referential integrity with Exercise table
    /// </summary>
    public class WorkoutLogExercise
    {
        public int WorkoutLogExerciseId { get; set; }

        /// <summary>
        /// Reference to the parent workout log (session)
        /// </summary>
        public int LogId { get; set; }

        /// <summary>
        /// Reference to the exercise performed
        /// </summary>
        public int ExerciseId { get; set; }

        /// <summary>
        /// Order this exercise was performed in the workout
        /// </summary>
        public int OrderPerformed { get; set; }

        /// <summary>
        /// Number of sets completed (may differ from planned)
        /// </summary>
        public int SetsCompleted { get; set; }

        /// <summary>
        /// Reps per set in format "12,10,8" for tracking drop sets, etc.
        /// </summary>
        public string? RepsPerSet { get; set; }

        /// <summary>
        /// Weight used per set in format "100,100,105" (in user's preferred unit)
        /// </summary>
        public string? WeightPerSet { get; set; }

        /// <summary>
        /// Total volume (sets × reps × weight) for quick aggregation
        /// </summary>
        public decimal? TotalVolume { get; set; }

        /// <summary>
        /// Rest time between sets (seconds)
        /// </summary>
        public int? RestSecondsBetweenSets { get; set; }

        /// <summary>
        /// Duration in seconds (for timed exercises like planks)
        /// </summary>
        public int? DurationSeconds { get; set; }

        /// <summary>
        /// Rate of Perceived Exertion (1-10 scale) - useful for AI training
        /// </summary>
        public int? Rpe { get; set; }

        /// <summary>
        /// Personal notes about this specific exercise
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// Was this a personal record?
        /// </summary>
        public bool IsPersonalRecord { get; set; } = false;

        /// <summary>
        /// Reference to the planned exercise (if following a plan)
        /// </summary>
        public int? PlannedExerciseId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual WorkoutLog WorkoutLog { get; set; } = null!;
        public virtual Exercise Exercise { get; set; } = null!;
        public virtual WorkoutPlanExercise? PlannedExercise { get; set; }
    }
}
