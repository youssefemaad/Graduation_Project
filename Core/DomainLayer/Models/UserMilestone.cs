using System;

namespace IntelliFit.Domain.Models
{
    public class UserMilestone
    {
        public int UserMilestoneId { get; set; }
        public int UserId { get; set; }
        public int MilestoneId { get; set; }
        public int CurrentProgress { get; set; } = 0;
        public bool IsCompleted { get; set; } = false;
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual ProgressMilestone Milestone { get; set; } = null!;
    }
}
