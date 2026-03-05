using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/stats")]
    public class StatsController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get Stats
        [HttpGet("member/{memberId}")]
        public async Task<IActionResult> GetMemberStats(int memberId)
        {
            try
            {
                var stats = await _serviceManager.StatsService.GetMemberStatsAsync(memberId);
                return Ok(stats);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("coach/{coachId}")]
        public async Task<IActionResult> GetCoachStats(int coachId)
        {
            try
            {
                var stats = await _serviceManager.StatsService.GetCoachStatsAsync(coachId);
                return Ok(stats);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("reception")]
        public async Task<IActionResult> GetReceptionStats()
        {
            var stats = await _serviceManager.StatsService.GetReceptionStatsAsync();
            return Ok(stats);
        }
        #endregion
    }
}
