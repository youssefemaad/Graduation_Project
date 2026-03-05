using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Meal
{
    public class CreateMealDto
    {
        [Required]
        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        public int? Calories { get; set; }

        public decimal? ProteinGrams { get; set; }

        public decimal? CarbsGrams { get; set; }

        public decimal? FatGrams { get; set; }

        public string? MealType { get; set; }

        public string? PreparationTime { get; set; }

        public string? CookingInstructions { get; set; }


        [Required(ErrorMessage = "NutritionPlanId is required. Meals must be associated with a nutrition plan.")]
        public int NutritionPlanId { get; set; }
    }
}
