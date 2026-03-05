namespace Shared.DTOs.Reception
{
    public class MemberSearchDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public string? Email { get; set; }
        public string MemberNumber { get; set; } = null!;
        public string? ProfileImageUrl { get; set; }
        public string? SubscriptionPlan { get; set; }
        public bool IsActive { get; set; }
    }
}
