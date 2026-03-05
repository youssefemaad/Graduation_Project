using Microsoft.AspNetCore.SignalR;
using ServiceAbstraction.Services;
using IntelliFit.Presentation.Hubs;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Shared.DTOs.User;
using AutoMapper;

namespace Service.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public NotificationService(
            IHubContext<NotificationHub> hubContext,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _hubContext = hubContext;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        // Database Operations
        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
        {
            var notification = _mapper.Map<Notification>(dto);

            await _unitOfWork.Repository<Notification>().AddAsync(notification);
            await _unitOfWork.SaveChangesAsync();

            // Send real-time notification
            await SendNotificationToUserAsync(dto.UserId, dto.Title, dto.Message, dto.NotificationType);

            return _mapper.Map<NotificationDto>(notification);
        }

        public async Task<NotificationDto?> GetNotificationByIdAsync(int notificationId)
        {
            var notification = await _unitOfWork.Repository<Notification>().GetByIdAsync(notificationId);
            return notification != null ? _mapper.Map<NotificationDto>(notification) : null;
        }

        public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
        {
            var notifications = await _unitOfWork.Repository<Notification>().GetAllAsync();
            var userNotifications = notifications.Where(n => n.UserId == userId);

            if (unreadOnly)
                userNotifications = userNotifications.Where(n => !n.IsRead);

            return userNotifications.OrderByDescending(n => n.CreatedAt).Select(n => _mapper.Map<NotificationDto>(n));
        }

        public async Task<NotificationDto?> MarkAsReadAsync(int notificationId)
        {
            var notification = await _unitOfWork.Repository<Notification>().GetByIdAsync(notificationId);
            if (notification == null) return null;

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            _unitOfWork.Repository<Notification>().Update(notification);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<NotificationDto>(notification);
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            var notifications = await _unitOfWork.Repository<Notification>().GetAllAsync();
            var userNotifications = notifications.Where(n => n.UserId == userId && !n.IsRead);

            foreach (var notification in userNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                _unitOfWork.Repository<Notification>().Update(notification);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteNotificationAsync(int notificationId)
        {
            var notification = await _unitOfWork.Repository<Notification>().GetByIdAsync(notificationId);
            if (notification != null)
            {
                _unitOfWork.Repository<Notification>().Remove(notification);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            var notifications = await _unitOfWork.Repository<Notification>().GetAllAsync();
            return notifications.Count(n => n.UserId == userId && !n.IsRead);
        }

        // SignalR Operations

        public async Task SendNotificationToUserAsync(int userId, string title, string message, string type)
        {
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
            {
                title,
                message,
                type,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task SendNotificationToRoleAsync(string role, string title, string message, string type)
        {
            await _hubContext.Clients.Group($"role_{role}").SendAsync("ReceiveNotification", new
            {
                title,
                message,
                type,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task SendNotificationToAllAsync(string title, string message, string type)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                title,
                message,
                type,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task SendBookingConfirmationAsync(int userId, string bookingDetails)
        {
            await SendNotificationToUserAsync(
                userId,
                "Booking Confirmed",
                $"Your booking has been confirmed: {bookingDetails}",
                "success"
            );
        }

        public async Task SendBookingCancellationAsync(int userId, string reason)
        {
            await SendNotificationToUserAsync(
                userId,
                "Booking Cancelled",
                $"Your booking has been cancelled. Reason: {reason}",
                "warning"
            );
        }

        public async Task SendWorkoutPlanAssignedAsync(int memberId, string planName, string coachName)
        {
            await SendNotificationToUserAsync(
                memberId,
                "New Workout Plan",
                $"Coach {coachName} has assigned you a new workout plan: {planName}",
                "info"
            );
        }

        public async Task SendEquipmentStatusUpdateAsync(string equipmentName, string status)
        {
            await SendNotificationToRoleAsync(
                "Reception",
                "Equipment Status Update",
                $"{equipmentName} is now {status}",
                "info"
            );
        }

        public async Task SendPaymentConfirmationAsync(int userId, decimal amount, string description)
        {
            await SendNotificationToUserAsync(
                userId,
                "Payment Confirmed",
                $"Payment of ${amount:F2} for {description} has been processed successfully",
                "success"
            );
        }
    }
}
