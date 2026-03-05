namespace Shared.DTOs.Reception
{
    public class CheckInDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string MemberNumber { get; set; } = null!;
        public string? SubscriptionPlan { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastVisit { get; set; }
        public int CurrentStreak { get; set; }
        public bool HasActiveStreak { get; set; }
        public TodaySessionDto? TodaySession { get; set; }
    }

    public class TodaySessionDto
    {
        public int BookingId { get; set; }
        public string SessionType { get; set; } = null!;
        public string CoachName { get; set; } = null!;
        public DateTime StartTime { get; set; }
    }
}
