using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Subscription;
using Shared.Helpers;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubscriptionController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get Subscription Plans
        /// <summary>
        /// Get all subscription plans
        /// </summary>
        [HttpGet("plans")]
        public async Task<ActionResult<ApiResponse<IEnumerable<SubscriptionPlanDto>>>> GetAllPlans()
        {
            try
            {
                var plans = await _serviceManager.SubscriptionService.GetAllPlansAsync();
                return Ok(ApiResponse<IEnumerable<SubscriptionPlanDto>>.SuccessResponse(plans));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<SubscriptionPlanDto>>.ErrorResponse("Failed to retrieve plans", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get active subscription plans only
        /// </summary>
        [HttpGet("plans/active")]
        public async Task<ActionResult<ApiResponse<IEnumerable<SubscriptionPlanDto>>>> GetActivePlans()
        {
            try
            {
                var plans = await _serviceManager.SubscriptionService.GetActivePlansAsync();
                return Ok(ApiResponse<IEnumerable<SubscriptionPlanDto>>.SuccessResponse(plans));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<SubscriptionPlanDto>>.ErrorResponse("Failed to retrieve active plans", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get subscription plan by ID
        /// </summary>
        [HttpGet("plans/{id}")]
        public async Task<ActionResult<ApiResponse<SubscriptionPlanDto>>> GetPlanById(int id)
        {
            try
            {
                var plan = await _serviceManager.SubscriptionService.GetPlanByIdAsync(id);

                if (plan == null)
                {
                    return NotFound(ApiResponse<SubscriptionPlanDto>.ErrorResponse("Subscription plan not found"));
                }

                return Ok(ApiResponse<SubscriptionPlanDto>.SuccessResponse(plan));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<SubscriptionPlanDto>.ErrorResponse("Failed to retrieve plan", new List<string> { ex.Message }));
            }
        }
        #endregion

        #region Create and Manage Subscription
        /// <summary>
        /// Create user subscription
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<bool>>> CreateSubscription([FromBody] CreateSubscriptionDto createDto)
        {
            try
            {
                await _serviceManager.SubscriptionService.CreateUserSubscriptionAsync(createDto);
                return Ok(ApiResponse<bool>.SuccessResponse(true, "Subscription created successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Failed to create subscription", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Check if user has active subscription
        /// </summary>
        [HttpGet("user/{userId}/active")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<bool>>> HasActiveSubscription(int userId)
        {
            try
            {
                var hasActive = await _serviceManager.SubscriptionService.HasActiveSubscriptionAsync(userId);
                return Ok(ApiResponse<bool>.SuccessResponse(hasActive));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Failed to check subscription status", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get user's active subscription details
        /// </summary>
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UserSubscriptionDetailsDto>>> GetUserSubscription(int userId)
        {
            try
            {
                var details = await _serviceManager.SubscriptionService.GetUserSubscriptionDetailsAsync(userId);
                if (details == null)
                    return NotFound(ApiResponse<UserSubscriptionDetailsDto>.ErrorResponse("No active subscription found"));
                return Ok(ApiResponse<UserSubscriptionDetailsDto>.SuccessResponse(details));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<UserSubscriptionDetailsDto>.ErrorResponse("Failed to retrieve subscription details", new List<string> { ex.Message }));
            }
        }
        #endregion
    }
}
