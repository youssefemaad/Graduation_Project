using System;

namespace IntelliFit.Domain.Models
{
    public class WorkoutLog
    {
        public int LogId { get; set; }
        public int UserId { get; set; }
        public int? PlanId { get; set; }
        public DateTime WorkoutDate { get; set; } = DateTime.UtcNow.Date;
        public int? DurationMinutes { get; set; }
        public int? CaloriesBurned { get; set; }

        /// <summary>
        /// DEPRECATED: Use WorkoutLogExercises navigation property instead.
        /// Kept for backward compatibility during migration.
        /// </summary>
        [Obsolete("Use WorkoutLogExercises collection for normalized exercise tracking")]
        public string? ExercisesCompleted { get; set; }

        public string? Notes { get; set; }

        /// <summary>
        /// User's subjective feeling rating (1-5 scale)
        /// 1 = Very Poor, 2 = Poor, 3 = Average, 4 = Good, 5 = Excellent
        /// </summary>
        public int? FeelingRating { get; set; }

        /// <summary>
        /// Rate of Perceived Exertion (1-10 scale) for the overall workout
        /// </summary>
        public int? OverallRpe { get; set; }

        public bool Completed { get; set; } = true;

        /// <summary>
        /// Location of workout: "gym", "home", "outdoor", "hotel"
        /// </summary>
        public string? Location { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual WorkoutPlan? Plan { get; set; }

        /// <summary>
        /// Normalized exercise log entries for this workout session.
        /// Use this instead of ExercisesCompleted JSON string.
        /// </summary>
        public virtual ICollection<WorkoutLogExercise> WorkoutLogExercises { get; set; } = new List<WorkoutLogExercise>();

        /// <summary>
        /// NEW: User feedback submitted for this workout (AI learning)
        /// </summary>
        public virtual ICollection<WorkoutFeedback> Feedbacks { get; set; } = new List<WorkoutFeedback>();
    }
}
