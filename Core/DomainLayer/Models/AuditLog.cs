using System;
using System.Net;

namespace IntelliFit.Domain.Models
{
    public class AuditLog
    {
        public int LogId { get; set; }
        public int? UserId { get; set; }
        public string Action { get; set; } = null!;
        public string? TableName { get; set; }
        public int? RecordId { get; set; }
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        // Navigation properties
        public virtual User? User { get; set; }
    }
}

