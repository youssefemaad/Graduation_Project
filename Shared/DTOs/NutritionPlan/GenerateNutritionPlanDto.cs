using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.NutritionPlan
{
    public class GenerateNutritionPlanDto
    {
        [Required]
        public int MemberId { get; set; }

        [Required]
        public string PlanName { get; set; } = null!;

        public string? Description { get; set; }

        public int? CreatedByCoachId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public int? DailyCalories { get; set; }

        public int? ProteinGrams { get; set; }

        public int? CarbsGrams { get; set; }

        public int? FatGrams { get; set; }

        public string? DietaryRestrictions { get; set; }

        public string? FitnessGoal { get; set; }
    }
}
