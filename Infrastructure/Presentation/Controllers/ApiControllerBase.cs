using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class ApiControllerBase : ControllerBase
    {
        /// <summary>
        /// Gets the authenticated user's email from JWT claims
        /// </summary>
        protected string? GetEmailFromToken() => User.FindFirstValue(ClaimTypes.Email);

        /// <summary>
        /// Gets the authenticated user's ID from JWT claims
        /// </summary>
        protected int GetUserIdFromToken()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub");

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid or missing user ID in token");
            }

            return userId;
        }

        /// <summary>
        /// Gets the authenticated user's role from JWT claims
        /// </summary>
        protected string? GetRoleFromToken() => User.FindFirstValue(ClaimTypes.Role);

        /// <summary>
        /// Checks if the authenticated user has a specific role
        /// </summary>
        protected bool IsInRole(string role) => User.IsInRole(role);

        /// <summary>
        /// Checks if the authenticated user is an Admin
        /// </summary>
        protected bool IsAdmin => IsInRole("Admin");

        /// <summary>
        /// Checks if the authenticated user is a Coach
        /// </summary>
        protected bool IsCoach => IsInRole("Coach");

        /// <summary>
        /// Checks if the authenticated user is a Member
        /// </summary>
        protected bool IsMember => IsInRole("Member");

        /// <summary>
        /// Checks if the authenticated user is a Receptionist
        /// </summary>
        protected bool IsReceptionist => IsInRole("Receptionist");
    }
}
