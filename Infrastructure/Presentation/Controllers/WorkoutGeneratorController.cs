using Microsoft.AspNetCore.Mvc;
using Shared.DTOs;
using ServiceAbstraction.Services;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutGeneratorController : ControllerBase
    {
        private readonly IWorkoutGeneratorService _workoutGeneratorService;
        private readonly ILogger<WorkoutGeneratorController> _logger;

        public WorkoutGeneratorController(
            IWorkoutGeneratorService workoutGeneratorService,
            ILogger<WorkoutGeneratorController> logger)
        {
            _workoutGeneratorService = workoutGeneratorService;
            _logger = logger;
        }

        /// <summary>
        /// Generate a personalized workout plan using AI
        /// </summary>
        /// <param name="request">Workout plan requirements (days, level, goal, equipment)</param>
        /// <returns>Generated workout plan with exercises, sets, reps, etc.</returns>
        [HttpPost("generate")]
        [ProducesResponseType(typeof(WorkoutGeneratorPlan), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GenerateWorkoutPlan([FromBody] GenerateWorkoutRequest request)
        {
            if (request == null)
            {
                return BadRequest("Request cannot be null");
            }

            if (request.Days < 1 || request.Days > 7)
            {
                return BadRequest("Days must be between 1 and 7");
            }

            if (string.IsNullOrWhiteSpace(request.Level))
            {
                return BadRequest("Fitness level is required");
            }

            if (string.IsNullOrWhiteSpace(request.Goal))
            {
                return BadRequest("Goal is required");
            }

            try
            {
                var plan = await _workoutGeneratorService.GenerateWorkoutPlanAsync(request);

                if (plan == null)
                {
                    return StatusCode(500, "Failed to generate workout plan");
                }

                return Ok(plan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating workout plan");
                return StatusCode(500, "An error occurred while generating the workout plan");
            }
        }

        /// <summary>
        /// Health check for the workout generator API
        /// </summary>
        [HttpGet("health")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult HealthCheck()
        {
            return Ok(new { status = "healthy", service = "WorkoutGenerator" });
        }
    }
}
