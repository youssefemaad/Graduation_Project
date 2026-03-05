using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.WorkoutPlan;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/workout-logs")]
    public class WorkoutLogController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Workout Log

        [HttpPost]
        public async Task<ActionResult<WorkoutLogDto>> CreateWorkoutLog([FromBody] CreateWorkoutLogDto dto)
        {
            var userId = GetUserIdFromToken();
            var log = await _serviceManager.WorkoutLogService.CreateWorkoutLogAsync(userId, dto);
            return Ok(log);
        }

        #endregion

        #region Get Workout Log

        [HttpGet("{id}")]
        public async Task<ActionResult<WorkoutLogDto>> GetWorkoutLog(int id)
        {
            var log = await _serviceManager.WorkoutLogService.GetWorkoutLogByIdAsync(id);
            if (log == null) return NotFound();
            return Ok(log);
        }

        #endregion

        #region Get User Workout Logs

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<WorkoutLogDto>>> GetUserWorkoutLogs(int userId)
        {
            var logs = await _serviceManager.WorkoutLogService.GetUserWorkoutLogsAsync(userId);
            return Ok(logs);
        }

        #endregion

        #region Get Workout Logs By Plan

        [HttpGet("plan/{planId}")]
        public async Task<ActionResult<IEnumerable<WorkoutLogDto>>> GetWorkoutLogsByPlan(int planId)
        {
            var logs = await _serviceManager.WorkoutLogService.GetWorkoutLogsByPlanAsync(planId);
            return Ok(logs);
        }

        #endregion

        #region Update Workout Log

        [HttpPut("{id}")]
        public async Task<ActionResult<WorkoutLogDto>> UpdateWorkoutLog(int id, [FromBody] UpdateWorkoutLogDto dto)
        {
            var log = await _serviceManager.WorkoutLogService.UpdateWorkoutLogAsync(id, dto);
            if (log == null) return NotFound();
            return Ok(log);
        }

        #endregion

        #region Delete Workout Log

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteWorkoutLog(int id)
        {
            await _serviceManager.WorkoutLogService.DeleteWorkoutLogAsync(id);
            return NoContent();
        }

        #endregion
    }
}
