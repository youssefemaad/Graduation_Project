namespace IntelliFit.Shared.DTOs.WorkoutPlan
{
    public class WorkoutLogDto
    {
        public int LogId { get; set; }
        public int UserId { get; set; }
        public int PlanId { get; set; }
        public DateTime WorkoutDate { get; set; }
        public int? DurationMinutes { get; set; }
        public int? CaloriesBurned { get; set; }
        public string? ExercisesCompleted { get; set; }
        public string? Notes { get; set; }
        public int? FeelingRating { get; set; }
        public bool Completed { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateWorkoutLogDto
    {
        public int PlanId { get; set; }
        public DateTime WorkoutDate { get; set; }
        public int? DurationMinutes { get; set; }
        public int? CaloriesBurned { get; set; }
        public string? ExercisesCompleted { get; set; }
        public string? Notes { get; set; }
        public int? FeelingRating { get; set; }
        public bool Completed { get; set; }
    }

    public class UpdateWorkoutLogDto
    {
        public int? DurationMinutes { get; set; }
        public int? CaloriesBurned { get; set; }
        public string? ExercisesCompleted { get; set; }
        public string? Notes { get; set; }
        public int? FeelingRating { get; set; }
        public bool? Completed { get; set; }
    }
}
