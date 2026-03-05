using System;

namespace IntelliFit.Domain.Models
{
    public class AiProgramGeneration
    {
        public int GenerationId { get; set; }
        public int UserId { get; set; }
        public string ProgramType { get; set; } = null!;
        public string InputPrompt { get; set; } = null!;
        public string? UserContext { get; set; }
        public string? AiModel { get; set; }
        public string? GeneratedPlan { get; set; }
        public int? TokensUsed { get; set; }
        public int? GenerationTimeMs { get; set; }
        public int? WorkoutPlanId { get; set; }
        public int? NutritionPlanId { get; set; }
        public int? QualityRating { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual WorkoutPlan? WorkoutPlan { get; set; }
        public virtual NutritionPlan? NutritionPlan { get; set; }
    }
}

