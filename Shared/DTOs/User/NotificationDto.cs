namespace IntelliFit.Shared.DTOs.User
{
    public class NotificationDto
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public string NotificationType { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateNotificationDto
    {
        public int UserId { get; set; }
        public string NotificationType { get; set; } = null!;
        public string? Priority { get; set; } = "normal";
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
    }

    public class MarkNotificationReadDto
    {
        public int NotificationId { get; set; }
    }
}
