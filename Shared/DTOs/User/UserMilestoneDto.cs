namespace IntelliFit.Shared.DTOs.User
{
    public class UserMilestoneDto
    {
        public int UserMilestoneId { get; set; }
        public int UserId { get; set; }
        public int MilestoneId { get; set; }
        public int CurrentProgress { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? MilestoneName { get; set; }
        public string? MilestoneDescription { get; set; }
        public int? MilestoneTarget { get; set; }
    }

    public class UpdateUserMilestoneProgressDto
    {
        public int MilestoneId { get; set; }
        public int CurrentProgress { get; set; }
    }

    public class CompleteMilestoneDto
    {
        public int MilestoneId { get; set; }
    }
}
