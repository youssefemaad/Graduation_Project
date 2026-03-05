namespace IntelliFit.Shared.DTOs.WorkoutPlan
{
    public class WorkoutTemplateDto
    {
        public int TemplateId { get; set; }
        public int CreatedByCoachId { get; set; }
        public string TemplateName { get; set; } = null!;
        public string? Description { get; set; }
        public string DifficultyLevel { get; set; } = null!;
        public int DurationWeeks { get; set; }
        public int WorkoutsPerWeek { get; set; }
        public bool IsPublic { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CoachName { get; set; }
        public List<WorkoutTemplateExerciseDto>? Exercises { get; set; }
    }

    public class CreateWorkoutTemplateDto
    {
        public string TemplateName { get; set; } = null!;
        public string? Description { get; set; }
        public string DifficultyLevel { get; set; } = null!;
        public int DurationWeeks { get; set; }
        public int WorkoutsPerWeek { get; set; }
        public bool IsPublic { get; set; } = true;
        public List<CreateWorkoutTemplateExerciseDto>? Exercises { get; set; }
    }

    public class UpdateWorkoutTemplateDto
    {
        public string? TemplateName { get; set; }
        public string? Description { get; set; }
        public string? DifficultyLevel { get; set; }
        public int? DurationWeeks { get; set; }
        public int? WorkoutsPerWeek { get; set; }
        public bool? IsPublic { get; set; }
        public bool? IsActive { get; set; }
    }

    public class WorkoutTemplateExerciseDto
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
        public DateTime CreatedAt { get; set; }
        public string? ExerciseName { get; set; }
    }

    public class CreateWorkoutTemplateExerciseDto
    {
        public int ExerciseId { get; set; }
        public int WeekNumber { get; set; }
        public int DayNumber { get; set; }
        public int OrderInDay { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public int? RestSeconds { get; set; }
        public string? Notes { get; set; }
    }
}
