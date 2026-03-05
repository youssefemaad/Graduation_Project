using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;
using Shared.DTOs.Meal;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/meals")]
    public class MealController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get Meals
        [HttpGet]
        public async Task<IActionResult> GetAllMeals()
        {
            var meals = await _serviceManager.MealService.GetAllMealsAsync();
            return Ok(meals);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveMeals()
        {
            var meals = await _serviceManager.MealService.GetActiveMealsAsync();
            return Ok(meals);
        }

        [HttpGet("{mealId}")]
        public async Task<IActionResult> GetMealById(int mealId)
        {
            var meal = await _serviceManager.MealService.GetMealByIdAsync(mealId);
            if (meal == null)
            {
                return NotFound(new { message = "Meal not found" });
            }
            return Ok(meal);
        }
        #endregion

        #region Create and Update Meal
        [HttpPost]
        public async Task<IActionResult> CreateMeal([FromBody] CreateMealDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var meal = await _serviceManager.MealService.CreateMealAsync(createDto);
            return CreatedAtAction(nameof(GetMealById), new { mealId = meal.MealId }, meal);
        }

        [HttpPut("{mealId}")]
        public async Task<IActionResult> UpdateMeal(int mealId, [FromBody] CreateMealDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var meal = await _serviceManager.MealService.UpdateMealAsync(mealId, updateDto);
                return Ok(meal);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        #endregion

        #region Delete Meal
        [HttpDelete("{mealId}")]
        public async Task<IActionResult> DeleteMeal(int mealId)
        {
            try
            {
                await _serviceManager.MealService.DeleteMealAsync(mealId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        #endregion
    }
}
