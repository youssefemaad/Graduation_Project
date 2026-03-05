using IntelliFit.Shared.DTOs.User;

namespace ServiceAbstraction.Services
{
    public interface INotificationService
    {
        // Database Operations
        Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);
        Task<NotificationDto> GetNotificationByIdAsync(int notificationId);
        Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false);
        Task<NotificationDto> MarkAsReadAsync(int notificationId);
        Task MarkAllAsReadAsync(int userId);
        Task DeleteNotificationAsync(int notificationId);
        Task<int> GetUnreadCountAsync(int userId);

        // SignalR Real-time Operations
        /// <summary>
        /// Send notification to a specific user
        /// </summary>
        Task SendNotificationToUserAsync(int userId, string title, string message, string type);

        /// <summary>
        /// Send notification to all users with a specific role
        /// </summary>
        Task SendNotificationToRoleAsync(string role, string title, string message, string type);

        /// <summary>
        /// Send notification to all connected users
        /// </summary>
        Task SendNotificationToAllAsync(string title, string message, string type);

        /// <summary>
        /// Send booking confirmation notification
        /// </summary>
        Task SendBookingConfirmationAsync(int userId, string bookingDetails);

        /// <summary>
        /// Send booking cancellation notification
        /// </summary>
        Task SendBookingCancellationAsync(int userId, string reason);

        /// <summary>
        /// Send workout plan assignment notification
        /// </summary>
        Task SendWorkoutPlanAssignedAsync(int memberId, string planName, string coachName);

        /// <summary>
        /// Send equipment status update notification
        /// </summary>
        Task SendEquipmentStatusUpdateAsync(string equipmentName, string status);

        /// <summary>
        /// Send payment confirmation notification
        /// </summary>
        Task SendPaymentConfirmationAsync(int userId, decimal amount, string description);
    }
}
