namespace Shared.DTOs.Reception
{
    public class LiveActivityDto
    {
        public int ActivityId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = null!;
        public string? UserImageUrl { get; set; }
        public string ActivityType { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public string TimeAgo { get; set; } = null!;
    }
}
