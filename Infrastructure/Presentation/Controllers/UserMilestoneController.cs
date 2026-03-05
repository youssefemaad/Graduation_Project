using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.User;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/user-milestones")]
    public class UserMilestoneController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get User Milestone

        [HttpGet("user/{userId}/milestone/{milestoneId}")]
        public async Task<ActionResult<UserMilestoneDto>> GetUserMilestone(int userId, int milestoneId)
        {
            var milestone = await _serviceManager.UserMilestoneService.GetUserMilestoneAsync(userId, milestoneId);
            if (milestone == null) return NotFound();
            return Ok(milestone);
        }

        #endregion

        #region Get User Milestones

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<UserMilestoneDto>>> GetUserMilestones(int userId)
        {
            var milestones = await _serviceManager.UserMilestoneService.GetUserMilestonesAsync(userId);
            return Ok(milestones);
        }

        #endregion

        #region Update Milestone Progress

        [HttpPut("user/{userId}/progress")]
        public async Task<ActionResult<UserMilestoneDto>> UpdateMilestoneProgress(int userId, [FromBody] UpdateUserMilestoneProgressDto dto)
        {
            var milestone = await _serviceManager.UserMilestoneService.UpdateMilestoneProgressAsync(userId, dto);
            if (milestone == null) return NotFound();
            return Ok(milestone);
        }

        #endregion

        #region Complete Milestone

        [HttpPut("user/{userId}/complete")]
        public async Task<ActionResult<UserMilestoneDto>> CompleteMilestone(int userId, [FromBody] CompleteMilestoneDto dto)
        {
            var milestone = await _serviceManager.UserMilestoneService.CompleteMilestoneAsync(userId, dto);
            if (milestone == null) return NotFound();
            return Ok(milestone);
        }

        #endregion
    }
}
