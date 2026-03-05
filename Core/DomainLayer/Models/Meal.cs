using System;

namespace IntelliFit.Domain.Models
{
    public class Meal
    {
        public int MealId { get; set; }
        public int NutritionPlanId { get; set; }
        public string MealType { get; set; } = null!;
        public string Name { get; set; } = null!;
        public int Calories { get; set; }
        public int ProteinGrams { get; set; }
        public int CarbsGrams { get; set; }
        public int FatsGrams { get; set; }
        public TimeSpan RecommendedTime { get; set; }
        public int? CreatedByCoachId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual NutritionPlan NutritionPlan { get; set; } = null!;
        public virtual CoachProfile? CreatedByCoach { get; set; }
        public virtual ICollection<MealIngredient> Ingredients { get; set; } = new List<MealIngredient>();
    }
}