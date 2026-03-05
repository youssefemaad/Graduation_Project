using Shared.DTOs.Meal;

namespace ServiceAbstraction.Services
{
    public interface IMealService
    {
        Task<IEnumerable<MealDto>> GetAllMealsAsync();
        Task<IEnumerable<MealDto>> GetActiveMealsAsync();
        Task<MealDto?> GetMealByIdAsync(int mealId);
        Task<MealDto> CreateMealAsync(CreateMealDto createDto);
        Task<MealDto> UpdateMealAsync(int mealId, CreateMealDto updateDto);
        Task DeleteMealAsync(int mealId);
    }
}
