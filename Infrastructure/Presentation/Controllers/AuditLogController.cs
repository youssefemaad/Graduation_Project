using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.User;

namespace Presentation.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/audit-logs")]
    public class AuditLogController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Audit Log

        [HttpPost]
        public async Task<ActionResult<AuditLogDto>> CreateAuditLog([FromBody] CreateAuditLogDto dto)
        {
            var log = await _serviceManager.AuditLogService.CreateAuditLogAsync(dto);
            return Ok(log);
        }

        #endregion

        #region Get Audit Log

        [HttpGet("{id}")]
        public async Task<ActionResult<AuditLogDto>> GetAuditLog(int id)
        {
            var log = await _serviceManager.AuditLogService.GetAuditLogByIdAsync(id);
            if (log == null) return NotFound();
            return Ok(log);
        }

        #endregion

        #region Get User Audit Logs

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetUserAuditLogs(int userId, [FromQuery] int limit = 100)
        {
            var logs = await _serviceManager.AuditLogService.GetUserAuditLogsAsync(userId, limit);
            return Ok(logs);
        }

        #endregion

        #region Get Table Audit Logs

        [HttpGet("table/{tableName}")]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetTableAuditLogs(string tableName, [FromQuery] int limit = 100)
        {
            var logs = await _serviceManager.AuditLogService.GetTableAuditLogsAsync(tableName, limit);
            return Ok(logs);
        }

        #endregion
    }
}
