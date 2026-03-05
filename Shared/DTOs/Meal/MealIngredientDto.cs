namespace IntelliFit.Shared.DTOs.Meal
{
    public class MealIngredientDto
    {
        public int MealIngredientId { get; set; }
        public int MealId { get; set; }
        public int IngredientId { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = null!;
        public string? IngredientName { get; set; }
    }

    public class CreateMealIngredientDto
    {
        public int IngredientId { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = null!;
    }
}
