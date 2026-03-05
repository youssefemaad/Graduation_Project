namespace Shared.DTOs.NutritionPlan
{
    public class NutritionPlanDto
    {
        public int PlanId { get; set; }
        public int MemberId { get; set; }
        public string MemberName { get; set; } = null!;
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }
        public int? CreatedByCoachId { get; set; }
        public string? CoachName { get; set; }
        public int? CreatedByAiAgentId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? DailyCalories { get; set; }
        public int? ProteinGrams { get; set; }
        public int? CarbsGrams { get; set; }
        public int? FatGrams { get; set; }
        public int Status { get; set; }
        public string StatusText { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
