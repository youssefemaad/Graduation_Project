namespace Shared.DTOs.Reception
{
    public class MemberListDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string MemberNumber { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public string Status { get; set; } = "Active"; // Active, Expired, Frozen
        public string? MembershipPlan { get; set; }
        public DateTime JoinDate { get; set; }
        public DateTime? LastVisit { get; set; }
    }
}
