namespace Shared.DTOs.WorkoutPlan
{
    public class WorkoutPlanDto
    {
        public int PlanId { get; set; }
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }
        public int? CreatedByCoachId { get; set; }
        public string? CoachName { get; set; }
        public int DurationWeeks { get; set; }
        public int DifficultyLevel { get; set; }
        public string? Goals { get; set; }
        public bool IsTemplate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
