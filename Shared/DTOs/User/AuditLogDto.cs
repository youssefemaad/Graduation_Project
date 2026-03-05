namespace IntelliFit.Shared.DTOs.User
{
    public class AuditLogDto
    {
        public int LogId { get; set; }
        public int UserId { get; set; }
        public string Action { get; set; } = null!;
        public string TableName { get; set; } = null!;
        public int RecordId { get; set; }
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UserName { get; set; }
    }

    public class CreateAuditLogDto
    {
        public int UserId { get; set; }
        public string Action { get; set; } = null!;
        public string TableName { get; set; } = null!;
        public int RecordId { get; set; }
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
    }
}
