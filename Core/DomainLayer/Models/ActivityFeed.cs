using System;

namespace IntelliFit.Domain.Models
{
    public class ActivityFeed
    {
        public int ActivityId { get; set; }
        public int UserId { get; set; }
        public string ActivityType { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
    }
}
