namespace Shared.DTOs.Subscription
{
    public class UserSubscriptionDetailsDto
    {
        public int SubscriptionId { get; set; }
        public int UserId { get; set; }
        public int PlanId { get; set; }
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }
        public string? Features { get; set; }
        public decimal Price { get; set; }
        public int TokensIncluded { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int DaysRemaining { get; set; }
        public string Status { get; set; } = null!;
        public bool AutoRenew { get; set; }
    }
}
