using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class Notification
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public NotificationType NotificationType { get; set; }
        public string Priority { get; set; } = "normal";
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string? ActionUrl { get; set; }
        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public string[]? SentVia { get; set; }
        public DateTime? EmailSentAt { get; set; }
        public DateTime? PushSentAt { get; set; }
        public DateTime? SmsSentAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;


        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}

