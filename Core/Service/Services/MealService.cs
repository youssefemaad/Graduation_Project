using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.Meal;

namespace Service.Services
{
    public class MealService : IMealService
    {
        private readonly IUnitOfWork _unitOfWork;

        public MealService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<MealDto>> GetAllMealsAsync()
        {
            var meals = await _unitOfWork.Repository<Meal>().GetAllAsync();
            return meals.Select(MapToDto);
        }

        public async Task<IEnumerable<MealDto>> GetActiveMealsAsync()
        {
            // Note: Meal entity doesn't have IsActive field, returning all meals
            return await GetAllMealsAsync();
        }

        public async Task<MealDto?> GetMealByIdAsync(int mealId)
        {
            var meal = await _unitOfWork.Repository<Meal>().GetByIdAsync(mealId);
            return meal == null ? null : MapToDto(meal);
        }

        public async Task<MealDto> CreateMealAsync(CreateMealDto createDto)
        {
            // For standalone meals, we need a nutrition plan. This might need adjustment based on requirements
            // Verify that the nutrition plan exists
            var nutritionPlan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(createDto.NutritionPlanId);
            if (nutritionPlan == null)
            {
                throw new KeyNotFoundException($"Nutrition plan with ID {createDto.NutritionPlanId} not found. Meals must be associated with an existing nutrition plan.");
            }

            var meal = new Meal
            {
                Name = createDto.Name,
                MealType = createDto.MealType ?? "Snack",
                Calories = createDto.Calories ?? 0,
                ProteinGrams = (int)(createDto.ProteinGrams ?? 0),
                CarbsGrams = (int)(createDto.CarbsGrams ?? 0),
                FatsGrams = (int)(createDto.FatGrams ?? 0),
                RecommendedTime = TimeSpan.Zero,
               // NutritionPlanId = 0, // This needs to be set properly
                NutritionPlanId = createDto.NutritionPlanId,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Meal>().AddAsync(meal);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(meal);
        }

        public async Task<MealDto> UpdateMealAsync(int mealId, CreateMealDto updateDto)
        {
            var meal = await _unitOfWork.Repository<Meal>().GetByIdAsync(mealId);

            if (meal == null)
            {
                throw new KeyNotFoundException($"Meal with ID {mealId} not found");
            }

            meal.Name = updateDto.Name;
            meal.MealType = updateDto.MealType ?? meal.MealType;
            meal.Calories = updateDto.Calories ?? meal.Calories;
            meal.ProteinGrams = (int)(updateDto.ProteinGrams ?? meal.ProteinGrams);
            meal.CarbsGrams = (int)(updateDto.CarbsGrams ?? meal.CarbsGrams);
            meal.FatsGrams = (int)(updateDto.FatGrams ?? meal.FatsGrams);

            _unitOfWork.Repository<Meal>().Update(meal);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(meal);
        }

        public async Task DeleteMealAsync(int mealId)
        {
            var meal = await _unitOfWork.Repository<Meal>().GetByIdAsync(mealId);

            if (meal == null)
            {
                throw new KeyNotFoundException($"Meal with ID {mealId} not found");
            }

            _unitOfWork.Repository<Meal>().Remove(meal);
            await _unitOfWork.SaveChangesAsync();
        }

        private MealDto MapToDto(Meal meal)
        {
            return new MealDto
            {
                MealId = meal.MealId,
                Name = meal.Name,
                Description = null, // Not in entity
                ImageUrl = null, // Not in entity
                Calories = meal.Calories,
                ProteinGrams = meal.ProteinGrams,
                CarbsGrams = meal.CarbsGrams,
                FatGrams = meal.FatsGrams,
                MealType = meal.MealType,
                PreparationTime = null, // Not in entity
                CookingInstructions = null, // Not in entity
                IsActive = true, // Not in entity
                CreatedAt = meal.CreatedAt
            };
        }
    }
}
