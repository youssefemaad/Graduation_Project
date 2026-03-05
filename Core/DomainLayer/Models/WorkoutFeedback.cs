using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// User feedback after completing workouts - drives AI learning loop
    /// Updates strength profile based on weight difficulty ratings
    /// </summary>
    public class WorkoutFeedback
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int WorkoutLogId { get; set; }
        public int? WorkoutPlanId { get; set; }

        /// <summary>
        /// Overall workout rating (1-5 stars)
        /// </summary>
        public int? Rating { get; set; }

        /// <summary>
        /// Overall difficulty: TooEasy, Perfect, TooHard
        /// </summary>
        public string? DifficultyLevel { get; set; }

        /// <summary>
        /// Per-exercise feedback as JSON array
        /// Format: [
        ///   {
        ///     "exercise_id": 123,
        ///     "exercise_name": "Bench Press",
        ///     "weight_used": 70,
        ///     "weight_feeling": "TooLight|Perfect|TooHeavy",
        ///     "sets_completed": 4,
        ///     "sets_planned": 4,
        ///     "form_difficulty": "Poor|Fair|Good|Excellent"
        ///   }
        /// ]
        /// </summary>
        public string ExerciseFeedback { get; set; } = null!; // JSONB in database

        /// <summary>
        /// Free-text comments from user
        /// </summary>
        public string? Comments { get; set; }

        /// <summary>
        /// Feedback type: PostWorkout, MidProgram, PlanComplete
        /// </summary>
        public string FeedbackType { get; set; } = "PostWorkout";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual WorkoutLog WorkoutLog { get; set; } = null!;
        public virtual WorkoutPlan? WorkoutPlan { get; set; }
    }
}
