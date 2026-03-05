using System;

namespace IntelliFit.Domain.Models
{
    public class SubscriptionPlan
    {
        public int PlanId { get; set; }
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int DurationDays { get; set; }
        public int TokensIncluded { get; set; } = 0;
        public string? Features { get; set; }
        public int? MaxBookingsPerDay { get; set; }
        public bool IsPopular { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<UserSubscription> UserSubscriptions { get; set; } = new List<UserSubscription>();
    }
}
