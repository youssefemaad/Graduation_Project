namespace Shared.DTOs.Meal
{
    public class MealDto
    {
        public int MealId { get; set; }
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
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
