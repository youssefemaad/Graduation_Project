using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace IntelliFit.Presentation.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            // JWT uses 'sub' claim for user ID
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Add user to their personal group for targeted notifications
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

                // Add user to role-based groups
                var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                if (!string.IsNullOrEmpty(role))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");

                var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                if (!string.IsNullOrEmpty(role))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"role_{role}");
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Send notification to all connected users
        /// </summary>
        public async Task SendNotificationToAll(string title, string message, string type)
        {
            await Clients.All.SendAsync("ReceiveNotification", new
            {
                title,
                message,
                type,
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Mark notification as read
        /// </summary>
        public async Task MarkAsRead(int notificationId)
        {
            // This would typically update the database
            await Clients.Caller.SendAsync("NotificationRead", notificationId);
        }
    }
}
