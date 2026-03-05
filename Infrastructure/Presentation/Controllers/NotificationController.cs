using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.User;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/notifications")]
    public class NotificationController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Notification

        [HttpPost]
        public async Task<ActionResult<NotificationDto>> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            var notification = await _serviceManager.NotificationService.CreateNotificationAsync(dto);
            return Ok(notification);
        }

        #endregion

        #region Get Notification

        [HttpGet("{id}")]
        public async Task<ActionResult<NotificationDto>> GetNotification(int id)
        {
            var notification = await _serviceManager.NotificationService.GetNotificationByIdAsync(id);
            if (notification == null) return NotFound();
            return Ok(notification);
        }

        #endregion

        #region Get User Notifications

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetUserNotifications(int userId, [FromQuery] bool unreadOnly = false)
        {
            var notifications = await _serviceManager.NotificationService.GetUserNotificationsAsync(userId, unreadOnly);
            return Ok(notifications);
        }

        #endregion

        #region Get Unread Count

        [HttpGet("user/{userId}/unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount(int userId)
        {
            var count = await _serviceManager.NotificationService.GetUnreadCountAsync(userId);
            return Ok(count);
        }

        #endregion

        #region Mark As Read

        [HttpPut("{id}/read")]
        public async Task<ActionResult<NotificationDto>> MarkAsRead(int id)
        {
            var notification = await _serviceManager.NotificationService.MarkAsReadAsync(id);
            if (notification == null) return NotFound();
            return Ok(notification);
        }

        #endregion

        #region Mark All As Read

        [HttpPut("user/{userId}/read-all")]
        public async Task<ActionResult> MarkAllAsRead(int userId)
        {
            await _serviceManager.NotificationService.MarkAllAsReadAsync(userId);
            return Ok();
        }

        #endregion

        #region Delete Notification

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteNotification(int id)
        {
            await _serviceManager.NotificationService.DeleteNotificationAsync(id);
            return Ok();
        }

        #endregion
    }
}
