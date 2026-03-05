using System;

namespace IntelliFit.Domain.Models
{
    public class ProgressMilestone
    {
        public int MilestoneId { get; set; }
        public string MilestoneName { get; set; } = null!;
        public string? Description { get; set; }
        public string Category { get; set; } = null!;
        public int? TargetValue { get; set; }
        public string? Icon { get; set; }
        public int PointsReward { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<UserMilestone> UserMilestones { get; set; } = new List<UserMilestone>();
    }
}
