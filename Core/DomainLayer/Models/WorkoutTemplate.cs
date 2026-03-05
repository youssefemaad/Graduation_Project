using System;

namespace IntelliFit.Domain.Models
{
    public class WorkoutTemplate
    {
        public int TemplateId { get; set; }
        public int CreatedByCoachId { get; set; }
        public string TemplateName { get; set; } = null!;
        public string? Description { get; set; }
        public string? DifficultyLevel { get; set; }
        public int DurationWeeks { get; set; }
        public int WorkoutsPerWeek { get; set; }
        public bool IsPublic { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual CoachProfile CreatedByCoach { get; set; } = null!;
        public virtual ICollection<WorkoutTemplateExercise> TemplateExercises { get; set; } = new List<WorkoutTemplateExercise>();
    }
}
