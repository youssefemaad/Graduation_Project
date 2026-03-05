using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.User;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/activity-feed")]
    public class ActivityFeedController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Activity

        [HttpPost]
        public async Task<ActionResult<ActivityFeedDto>> CreateActivity([FromBody] CreateActivityFeedDto dto)
        {
            var activity = await _serviceManager.ActivityFeedService.CreateActivityAsync(dto);
            return Ok(activity);
        }

        #endregion

        #region Get User Activities

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ActivityFeedDto>>> GetUserActivities(int userId, [FromQuery] int limit = 50)
        {
            var activities = await _serviceManager.ActivityFeedService.GetUserActivitiesAsync(userId, limit);
            return Ok(activities);
        }

        #endregion

        #region Get Recent Activities

        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<ActivityFeedDto>>> GetRecentActivities([FromQuery] int limit = 100)
        {
            var activities = await _serviceManager.ActivityFeedService.GetRecentActivitiesAsync(limit);
            return Ok(activities);
        }

        #endregion

        #region Delete Activity

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteActivity(int id)
        {
            await _serviceManager.ActivityFeedService.DeleteActivityAsync(id);
            return NoContent();
        }

        #endregion
    }
}
