namespace IntelliFit.Domain.Models
{
    public class MealIngredient
    {
        public int MealIngredientId { get; set; }
        public int MealId { get; set; }
        public int IngredientId { get; set; }
        public decimal Quantity { get; set; }
        public string? Unit { get; set; }

        public virtual Meal Meal { get; set; } = null!;
        public virtual Ingredient Ingredient { get; set; } = null!;
    }
}