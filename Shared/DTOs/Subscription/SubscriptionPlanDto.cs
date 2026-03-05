namespace Shared.DTOs.Subscription
{
    public class SubscriptionPlanDto
    {
        public int PlanId { get; set; }
        public string PlanName { get; set; } = null!;
        public decimal Price { get; set; }
        public int DurationDays { get; set; }
        public string? Description { get; set; }
        public int TokensIncluded { get; set; }
        public string? Features { get; set; }
        public int? MaxBookingsPerDay { get; set; }
        public bool IsPopular { get; set; }
        public bool IsActive { get; set; }
    }
}
