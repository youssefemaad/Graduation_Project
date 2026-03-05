using System;

namespace IntelliFit.Domain.Models
{
    public class WorkoutPlanExercise
    {
        public int WorkoutPlanExerciseId { get; set; }
        public int WorkoutPlanId { get; set; }
        public int ExerciseId { get; set; }
        public int DayNumber { get; set; }
        public int OrderInDay { get; set; }
        public int? Sets { get; set; }
        public int? Reps { get; set; }
        public int? DurationMinutes { get; set; }
        public int? RestSeconds { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual WorkoutPlan WorkoutPlan { get; set; } = null!;
        public virtual Exercise Exercise { get; set; } = null!;
    }
}
