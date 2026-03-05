using System;

namespace IntelliFit.Domain.Models
{
    public class WorkoutTemplateExercise
    {
        public int TemplateExerciseId { get; set; }
        public int TemplateId { get; set; }
        public int ExerciseId { get; set; }
        public int WeekNumber { get; set; }
        public int DayNumber { get; set; }
        public int OrderInDay { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public int? RestSeconds { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual WorkoutTemplate Template { get; set; } = null!;
        public virtual Exercise Exercise { get; set; } = null!;
    }
}
