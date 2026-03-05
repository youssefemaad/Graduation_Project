namespace Shared.DTOs.Exercise
{
    public class ExerciseDto
    {
        public int ExerciseId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? TargetMuscleGroup { get; set; }
        public int? DifficultyLevel { get; set; }
        public string? VideoUrl { get; set; }
        public string? ImageUrl { get; set; }
        public int? CaloriesBurnedPerMinute { get; set; }
        public bool IsActive { get; set; }
    }
}
