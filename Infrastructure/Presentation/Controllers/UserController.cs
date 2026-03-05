using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.User;
using Microsoft.AspNetCore.Hosting;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/users")]
    public class UserController(IServiceManager _serviceManager, IWebHostEnvironment _env) : ApiControllerBase
    {
        #region Get User

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _serviceManager.UserService.GetUserByIdAsync(id);
            return Ok(user);
        }

        #endregion

        #region Update Profile

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateProfile(int id, [FromBody] UpdateProfileDto updateDto)
        {
            var user = await _serviceManager.UserService.UpdateProfileAsync(id, updateDto);
            return Ok(user);
        }

        #endregion

        #region Get Token Balance

        [HttpGet("{id}/tokens")]
        public async Task<ActionResult<int>> GetTokenBalance(int id)
        {
            var balance = await _serviceManager.UserService.GetTokenBalanceAsync(id);
            return Ok(balance);
        }

        #endregion

        #region Get Coaches List

        [HttpGet("coaches")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetCoaches()
        {
            var coaches = await _serviceManager.UserService.GetCoachesListAsync();
            return Ok(coaches);
        }

        [HttpGet("coaches/details")]
        public async Task<ActionResult<IEnumerable<CoachDto>>> GetCoachesWithProfiles()
        {
            var coaches = await _serviceManager.UserService.GetCoachesWithProfilesAsync();
            return Ok(coaches);
        }

        #endregion

        #region Deactivate User

        [HttpDelete("{id}")]
        public async Task<ActionResult<bool>> DeactivateUser(int id)
        {
            var result = await _serviceManager.UserService.DeactivateUserAsync(id);
            return Ok(result);
        }

        #endregion

        #region User Metrics

        /// <summary>
        /// Get user's physical metrics (weight, height, BMI, fitness goals)
        /// </summary>
        [HttpGet("{id}/metrics")]
        public async Task<ActionResult<UserMetricsDto>> GetUserMetrics(int id)
        {
            // Users can only access their own metrics unless they're admin/coach
            var currentUserId = GetUserIdFromToken();
            if (currentUserId != id && !IsAdmin && !IsCoach)
            {
                return Forbid();
            }

            var metrics = await _serviceManager.UserService.GetUserMetricsAsync(id);
            if (metrics == null)
            {
                return NotFound(new { message = "User metrics not found. User may not be a member." });
            }
            return Ok(metrics);
        }

        #endregion

        #region Workout Summary

        /// <summary>
        /// Get user's workout summary with statistics
        /// </summary>
        [HttpGet("{id}/workout-summary")]
        public async Task<ActionResult<UserWorkoutSummaryDto>> GetWorkoutSummary(
            int id,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var currentUserId = GetUserIdFromToken();
            if (currentUserId != id && !IsAdmin && !IsCoach)
            {
                return Forbid();
            }

            var summary = await _serviceManager.UserService.GetUserWorkoutSummaryAsync(id, startDate, endDate);
            return Ok(summary);
        }

        #endregion

        #region AI Context

        /// <summary>
        /// Get comprehensive user context for AI personalization
        /// </summary>
        [HttpGet("{id}/ai-context")]
        public async Task<ActionResult<UserAIContextDto>> GetUserAIContext(int id)
        {
            var currentUserId = GetUserIdFromToken();
            if (currentUserId != id && !IsAdmin && !IsCoach)
            {
                return Forbid();
            }

            var context = await _serviceManager.UserService.GetUserAIContextAsync(id);
            return Ok(context);
        }

        #endregion

        #region Upload Profile Image

        /// <summary>
        /// Upload profile image for a user
        /// </summary>
        [HttpPost("{id}/upload-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadProfileImage(int id, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "No file uploaded" });

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    return BadRequest(new { error = "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." });

                // Validate file size (max 5MB)
                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "File size exceeds 5MB limit" });

                // Create uploads directory
                var uploadsDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "profiles");
                Directory.CreateDirectory(uploadsDir);

                // Generate unique filename
                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{id}_{Guid.NewGuid():N}{fileExtension}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Update user profile image URL
                var imageUrl = $"/uploads/profiles/{fileName}";
                var updateDto = new UpdateProfileDto { ProfileImageUrl = imageUrl };
                var updatedUser = await _serviceManager.UserService.UpdateProfileAsync(id, updateDto);

                return Ok(new { profileImageUrl = imageUrl, message = "Profile image uploaded successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to upload image", details = ex.Message });
            }
        }

        #endregion
    }
}
