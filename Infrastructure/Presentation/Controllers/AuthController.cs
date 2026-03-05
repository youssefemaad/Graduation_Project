using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Auth;
using Shared.DTOs.User;
using System.Security.Claims;

namespace Presentation.Controllers
{
    public class AuthController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Login

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto loginDto)
        {
            try
            {
                var result = await _serviceManager.AuthService.LoginAsync(loginDto);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // Treat invalid operations as bad requests (e.g., account issues)
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Register (Public - Always Creates Member)

        /// <summary>
        /// Public registration - always creates users with Member role
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto registerDto)
        {
            try
            {
                var result = await _serviceManager.AuthService.RegisterAsync(registerDto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Admin-Only Create User With Role

        /// <summary>
        /// Admin-only endpoint to create users with any role (Coach, Receptionist, Admin)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("create-with-role")]
        public async Task<ActionResult<AuthResponseDto>> CreateUserWithRole(
            [FromBody] RegisterRequestDto registerDto,
            [FromQuery] string role)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(role))
                {
                    return BadRequest(new { error = "Role is required" });
                }

                var result = await _serviceManager.AuthService.CreateUserWithRoleAsync(registerDto, role);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Change Password

        /// <summary>
        /// Change password for authenticated user (used for first-login password change)
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { error = "Invalid user token" });
                }

                await _serviceManager.AuthService.ChangePasswordAsync(userId, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
                return Ok(new { message = "Password changed successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        #endregion

        #region Complete First Login Setup

        /// <summary>
        /// Mark first login setup as complete
        /// </summary>
        [Authorize]
        [HttpPost("complete-setup")]
        public async Task<ActionResult<UserDto>> CompleteFirstLoginSetup()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { error = "Invalid user token" });
                }

                var result = await _serviceManager.AuthService.CompleteFirstLoginSetupAsync(userId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        #endregion

        #region Check Email

        [HttpGet("emailexists")]
        public async Task<ActionResult<bool>> CheckEmail(string email)
        {
            var result = await _serviceManager.AuthService.EmailExistsAsync(email);
            return Ok(result);
        }

        #endregion
    }
}
