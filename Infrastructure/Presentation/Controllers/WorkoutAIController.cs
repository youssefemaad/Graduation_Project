using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutAI;

namespace Presentation.Controllers;

/// <summary>
/// Controller for AI-powered workout plan generation using Flan-T5 ML model
/// Includes endpoints for plan generation, feedback submission, and strength tracking
/// </summary>
[Authorize]
[ApiController]
[Route("api/workout-ai")]
public class WorkoutAIController : ApiControllerBase
{
    private readonly IWorkoutAIService _workoutAIService;
    private readonly IWorkoutFeedbackService _feedbackService;
    private readonly ILogger<WorkoutAIController> _logger;

    public WorkoutAIController(
        IWorkoutAIService workoutAIService,
        IWorkoutFeedbackService feedbackService,
        ILogger<WorkoutAIController> logger)
    {
        _workoutAIService = workoutAIService;
        _feedbackService = feedbackService;
        _logger = logger;
    }

    #region Plan Generation

    /// <summary>
    /// Generate a personalized AI workout plan using Flan-T5 model
    /// POST: api/workout-ai/generate
    /// </summary>
    /// <remarks>
    /// Generates a context-aware workout plan using:
    /// - User's InBody measurements
    /// - Muscle development scan results
    /// - Strength profile (1RM estimates)
    /// - Recent workout feedback
    /// 
    /// Results are cached for 24 hours unless force_regenerate is set.
    /// </remarks>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(AIWorkoutPlanResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GenerateWorkoutPlan([FromBody] GenerateAIWorkoutPlanRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AIWorkoutPlanResult
                {
                    Success = false,
                    ErrorMessage = "Invalid request data"
                });
            }

            // Ensure user ID matches authenticated user (or allow admin override)
            var authenticatedUserId = GetUserIdFromToken();
            if (request.UserId != authenticatedUserId && !IsAdmin)
            {
                request.UserId = authenticatedUserId;
            }

            _logger.LogInformation(
                "Generating AI workout plan for user {UserId}: {Goal}, {Level}, {Days} days/week",
                request.UserId, request.Goal, request.FitnessLevel, request.DaysPerWeek);

            var result = await _workoutAIService.GenerateWorkoutPlanAsync(request);

            if (!result.Success)
            {
                _logger.LogWarning("Failed to generate plan for user {UserId}: {Error}",
                    request.UserId, result.ErrorMessage);

                return BadRequest(result);
            }

            _logger.LogInformation(
                "Generated plan {PlanId} for user {UserId} (from_cache={FromCache}, latency={Latency}ms)",
                result.PlanId, request.UserId, result.FromCache, result.GenerationLatencyMs);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating workout plan for user");
            return StatusCode(500, new AIWorkoutPlanResult
            {
                Success = false,
                ErrorMessage = "An error occurred while generating the workout plan"
            });
        }
    }

    /// <summary>
    /// Check if ML service is available
    /// GET: api/workout-ai/health
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckMLServiceHealth()
    {
        var isHealthy = await _workoutAIService.IsMLServiceHealthyAsync();

        return Ok(new
        {
            status = isHealthy ? "healthy" : "unavailable",
            message = isHealthy
                ? "ML service is running and model is loaded"
                : "ML service is unavailable. Make sure the Python FastAPI server is running on port 5300."
        });
    }

    #endregion

    #region Feedback

    /// <summary>
    /// Submit feedback after completing a workout
    /// POST: api/workout-ai/feedback
    /// </summary>
    /// <remarks>
    /// Feedback drives the AI learning loop:
    /// - Updates user's strength profile based on weight feelings
    /// - Adjusts 1RM estimates when weights feel too light/heavy
    /// - Increases confidence scores when weights feel perfect
    /// 
    /// This data is used to personalize future workout plan generations.
    /// </remarks>
    [HttpPost("feedback")]
    [ProducesResponseType(typeof(WorkoutFeedbackResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitWorkoutFeedback([FromBody] SubmitWorkoutFeedbackRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new WorkoutFeedbackResult
                {
                    Success = false,
                    Message = "Invalid request data"
                });
            }

            var userId = GetUserIdFromToken();

            _logger.LogInformation(
                "Processing workout feedback for user {UserId}, workout log {WorkoutLogId}",
                userId, request.WorkoutLogId);

            var result = await _feedbackService.SubmitFeedbackAsync(userId, request);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            _logger.LogInformation(
                "Saved feedback {FeedbackId} with {UpdateCount} strength profile updates",
                result.FeedbackId, result.StrengthUpdates?.Count ?? 0);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting workout feedback");
            return StatusCode(500, new WorkoutFeedbackResult
            {
                Success = false,
                Message = "An error occurred while submitting feedback"
            });
        }
    }

    /// <summary>
    /// Get user's feedback history
    /// GET: api/workout-ai/feedback/history?limit=20
    /// </summary>
    [HttpGet("feedback/history")]
    [ProducesResponseType(typeof(IEnumerable<WorkoutFeedbackDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeedbackHistory([FromQuery] int limit = 20)
    {
        var userId = GetUserIdFromToken();
        var history = await _feedbackService.GetUserFeedbackHistoryAsync(userId, limit);
        return Ok(history);
    }

    #endregion

    #region Strength Profile

    /// <summary>
    /// Get user's strength profile (1RM estimates per exercise)
    /// GET: api/workout-ai/strength-profile
    /// </summary>
    /// <remarks>
    /// Returns estimated 1RM values for all exercises the user has logged feedback for.
    /// Includes confidence scores and strength trends.
    /// </remarks>
    [HttpGet("strength-profile")]
    [ProducesResponseType(typeof(UserStrengthProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStrengthProfile()
    {
        var userId = GetUserIdFromToken();
        var profile = await _workoutAIService.GetUserStrengthProfileAsync(userId);

        if (profile == null)
        {
            return NotFound(new
            {
                message = "No strength profile found. Complete some workouts and submit feedback to build your profile."
            });
        }

        return Ok(profile);
    }

    /// <summary>
    /// Get strength profile for a specific user (admin/coach only)
    /// GET: api/workout-ai/strength-profile/{userId}
    /// </summary>
    [HttpGet("strength-profile/{userId:int}")]
    [ProducesResponseType(typeof(UserStrengthProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStrengthProfileForUser(int userId)
    {
        // Only admin or coach can view other users' profiles
        if (!IsAdmin && !IsCoach)
        {
            return Forbid();
        }

        var profile = await _workoutAIService.GetUserStrengthProfileAsync(userId);

        if (profile == null)
        {
            return NotFound(new { message = "No strength profile found for this user." });
        }

        return Ok(profile);
    }

    #endregion

    #region Muscle Scan

    /// <summary>
    /// Get user's latest muscle development scan
    /// GET: api/workout-ai/muscle-scan
    /// </summary>
    /// <remarks>
    /// Returns the most recent vision AI analysis of body photos.
    /// Includes muscle scores, weak/strong areas, and body fat estimate.
    /// </remarks>
    [HttpGet("muscle-scan")]
    [ProducesResponseType(typeof(MuscleScanResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLatestMuscleScan()
    {
        var userId = GetUserIdFromToken();
        var scan = await _workoutAIService.GetLatestMuscleScanAsync(userId);

        if (scan == null)
        {
            return NotFound(new
            {
                message = "No muscle scan found. Upload a body photo for analysis."
            });
        }

        return Ok(scan);
    }

    /// <summary>
    /// Get muscle scan for a specific user (admin/coach only)
    /// GET: api/workout-ai/muscle-scan/{userId}
    /// </summary>
    [HttpGet("muscle-scan/{userId:int}")]
    [ProducesResponseType(typeof(MuscleScanResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMuscleScanForUser(int userId)
    {
        if (!IsAdmin && !IsCoach)
        {
            return Forbid();
        }

        var scan = await _workoutAIService.GetLatestMuscleScanAsync(userId);

        if (scan == null)
        {
            return NotFound(new { message = "No muscle scan found for this user." });
        }

        return Ok(scan);
    }

    /// <summary>
    /// Save AI-generated workout plan (called after frontend generates via direct ML API)
    /// POST: api/workout-ai/save-plan
    /// </summary>
    /// <remarks>
    /// This endpoint is used when frontend calls FastAPI directly for generation,
    /// then saves the result to the backend database asynchronously.
    /// Optimized flow: Frontend → ML API (direct) → Frontend → Backend (save)
    /// </remarks>
    [HttpPost("save-plan")]
    [AllowAnonymous]  // Allow anonymous for direct ML API workflow (frontend already authenticated)
    [ProducesResponseType(typeof(SavePlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SaveAIGeneratedPlan([FromBody] SaveAIGeneratedPlanRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new SavePlanResponse
                {
                    Success = false,
                    Error = "Invalid request data"
                });
            }

            // Ensure user ID matches authenticated user
            var authenticatedUserId = GetUserIdFromToken();
            if (request.UserId != authenticatedUserId && !IsAdmin)
            {
                return Forbid();
            }

            _logger.LogInformation(
                "Saving AI-generated plan for user {UserId}: {PlanName} ({Model}, {Latency}ms)",
                request.UserId, request.PlanName, request.ModelVersion, request.GenerationLatencyMs);

            var result = await _workoutAIService.SaveAIGeneratedPlanAsync(request);

            if (!result.Success)
            {
                _logger.LogWarning("Failed to save plan for user {UserId}: {Error}",
                    request.UserId, result.Error);

                return BadRequest(result);
            }

            _logger.LogInformation("Saved plan {PlanId} for user {UserId}",
                result.PlanId, request.UserId);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving AI-generated workout plan");
            return StatusCode(500, new SavePlanResponse
            {
                Success = false,
                Error = "An error occurred while saving the workout plan"
            });
        }
    }

    /// <summary>
    /// Get user's saved AI-generated workout plans
    /// GET: api/workout-ai/my-plans
    /// </summary>
    [HttpGet("my-plans")]
    [ProducesResponseType(typeof(List<UserAIWorkoutPlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyAIPlans()
    {
        try
        {
            var userId = GetUserIdFromToken();
            var plans = await _workoutAIService.GetUserAIPlansAsync(userId);
            return Ok(plans);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching AI plans");
            return StatusCode(500, new { error = "Failed to fetch workout plans" });
        }
    }

    /// <summary>
    /// Get AI-generated workout plans for a specific user (admin/coach)
    /// GET: api/workout-ai/user-plans/{userId}
    /// </summary>
    [HttpGet("user-plans/{userId:int}")]
    [ProducesResponseType(typeof(List<UserAIWorkoutPlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserAIPlans(int userId)
    {
        try
        {
            var plans = await _workoutAIService.GetUserAIPlansAsync(userId);
            return Ok(plans);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching AI plans for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to fetch workout plans" });
        }
    }

    /// <summary>
    /// Delete AI-generated workout plan
    /// DELETE: api/workout-ai/my-plans/{planId}
    /// </summary>
    [HttpDelete("my-plans/{planId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAIPlan(int planId)
    {
        try
        {
            var userId = GetUserIdFromToken();
            var success = await _workoutAIService.DeleteUserAIPlanAsync(planId, userId);
            
            if (!success)
            {
                return NotFound(new { message = "Plan not found or you do not have permission to delete it" });
            }
            
            return Ok(new { success = true, message = "Plan deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting AI plan {PlanId}", planId);
            return StatusCode(500, new { error = "Failed to delete workout plan" });
        }
    }

    #endregion
}
