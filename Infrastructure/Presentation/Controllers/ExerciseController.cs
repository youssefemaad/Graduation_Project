using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Exercise;
using Shared.Helpers;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExerciseController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get All Exercises
        /// <summary>
        /// Get all exercises
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<ExerciseDto>>>> GetAllExercises()
        {
            try
            {
                var exercises = await _serviceManager.ExerciseService.GetAllExercisesAsync();
                return Ok(ApiResponse<IEnumerable<ExerciseDto>>.SuccessResponse(exercises));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<ExerciseDto>>.ErrorResponse("Failed to retrieve exercises", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get active exercises only
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ExerciseDto>>>> GetActiveExercises()
        {
            try
            {
                var exercises = await _serviceManager.ExerciseService.GetActiveExercisesAsync();
                return Ok(ApiResponse<IEnumerable<ExerciseDto>>.SuccessResponse(exercises));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<ExerciseDto>>.ErrorResponse("Failed to retrieve active exercises", new List<string> { ex.Message }));
            }
        }
        #endregion

        #region Get Exercise By Criteria
        /// <summary>
        /// Get exercise by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<ExerciseDto>>> GetExercise(int id)
        {
            try
            {
                var exercise = await _serviceManager.ExerciseService.GetExerciseByIdAsync(id);

                if (exercise == null)
                {
                    return NotFound(ApiResponse<ExerciseDto>.ErrorResponse("Exercise not found"));
                }

                return Ok(ApiResponse<ExerciseDto>.SuccessResponse(exercise));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<ExerciseDto>.ErrorResponse("Failed to retrieve exercise", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get exercises by muscle group
        /// </summary>
        [HttpGet("muscle-group/{muscleGroup}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ExerciseDto>>>> GetExercisesByMuscleGroup(string muscleGroup)
        {
            try
            {
                var exercises = await _serviceManager.ExerciseService.GetExercisesByMuscleGroupAsync(muscleGroup);
                return Ok(ApiResponse<IEnumerable<ExerciseDto>>.SuccessResponse(exercises));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<ExerciseDto>>.ErrorResponse("Failed to retrieve exercises", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get exercises by difficulty level
        /// </summary>
        [HttpGet("difficulty/{level}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ExerciseDto>>>> GetExercisesByDifficulty(int level)
        {
            try
            {
                var exercises = await _serviceManager.ExerciseService.GetExercisesByDifficultyAsync(level);
                return Ok(ApiResponse<IEnumerable<ExerciseDto>>.SuccessResponse(exercises));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<ExerciseDto>>.ErrorResponse("Failed to retrieve exercises", new List<string> { ex.Message }));
            }
        }
        #endregion
    }
}
