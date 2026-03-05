namespace Shared.DTOs.User
{
    /// <summary>
    /// DTO for user fitness metrics (for AI context)
    /// </summary>
    public class UserMetricsDto
    {
        public int UserId { get; set; }
        public string? Name { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }

        // Physical metrics
        public decimal? CurrentWeight { get; set; }
        public decimal? TargetWeight { get; set; }
        public decimal? Height { get; set; }
        public decimal? BMI { get; set; }

        // Fitness profile
        public string? FitnessGoal { get; set; }
        public string? FitnessLevel { get; set; }
        public string? PreferredWorkoutTime { get; set; }
        public string? MedicalConditions { get; set; }
        public string? Allergies { get; set; }

        // Progress stats
        public int TotalWorkoutsCompleted { get; set; }
        public int TotalCaloriesBurned { get; set; }
        public int WorkoutsThisWeek { get; set; }
        public int WorkoutsThisMonth { get; set; }
        public double AverageWorkoutDuration { get; set; }

        // Achievements
        public List<string> Achievements { get; set; } = new();

        // Recent activity summary
        public DateTime? LastWorkoutDate { get; set; }
        public int DaysSinceLastWorkout { get; set; }
    }

    /// <summary>
    /// Summary of user workout statistics over a period
    /// </summary>
    public class UserWorkoutSummaryDto
    {
        public int UserId { get; set; }
        public int TotalWorkouts { get; set; }
        public int TotalDurationMinutes { get; set; }
        public int TotalCaloriesBurned { get; set; }
        public int AverageWorkoutDuration { get; set; }
        public int AverageCaloriesPerWorkout { get; set; }
        public int CurrentStreak { get; set; }
        public int LongestStreak { get; set; }
        public List<string> FavoriteExercises { get; set; } = new();
        public DateTime? LastWorkoutDate { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }

    /// <summary>
    /// Recent workout details for AI context
    /// </summary>
    public class RecentWorkoutDto
    {
        public DateTime Date { get; set; }
        public string? Type { get; set; }
        public int DurationMinutes { get; set; }
        public int CaloriesBurned { get; set; }
        public string? Intensity { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Summary of recent workouts for AI context (legacy)
    /// </summary>
    public class WorkoutSummaryDto
    {
        public int LogId { get; set; }
        public DateTime WorkoutDate { get; set; }
        public int? DurationMinutes { get; set; }
        public int? CaloriesBurned { get; set; }
        public string? ExercisesCompleted { get; set; }
        public int? FeelingRating { get; set; }
        public string? Notes { get; set; }
        public string? PlanName { get; set; }
    }

    /// <summary>
    /// Complete user context for AI (metrics + recent workouts + health info)
    /// </summary>
    public class UserAIContextDto
    {
        public UserMetricsDto? Metrics { get; set; }
        public UserWorkoutSummaryDto? WorkoutSummary { get; set; }
        public List<RecentWorkoutDto> RecentWorkouts { get; set; } = new();
        public List<string> HealthConditions { get; set; } = new();
        public List<string> DietaryPreferences { get; set; } = new();
    }
}
