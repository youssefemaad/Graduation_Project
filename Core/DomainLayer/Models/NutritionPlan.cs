using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class NutritionPlan
    {
        public int PlanId { get; set; }
        public int UserId { get; set; }
        public string PlanName { get; set; } = null!; public string? Description { get; set; }
        public string PlanType { get; set; } = "Custom"; public int DailyCalories { get; set; }
        public int ProteinGrams { get; set; }
        public int CarbsGrams { get; set; }
        public int FatsGrams { get; set; }
        public string[]? DietaryRestrictions { get; set; }
        public int? GeneratedByCoachId { get; set; }
        public string? AiPrompt { get; set; }
        public string Status { get; set; } = "Draft"; public string? ApprovalNotes { get; set; }
        public int? ApprovedByCoachId { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int TokensSpent { get; set; } = 0; public bool IsActive { get; set; } = false; public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual CoachProfile? GeneratedByCoach { get; set; }
        public virtual CoachProfile? ApprovedByCoach { get; set; }
        public virtual ICollection<AiProgramGeneration> AiGenerations { get; set; } = new List<AiProgramGeneration>();
        public virtual ICollection<Meal> Meals { get; set; } = new List<Meal>();
    }
}
