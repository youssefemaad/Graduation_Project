using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class UserSubscription
    {
        public int SubscriptionId { get; set; }
        public int UserId { get; set; }
        public int PlanId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
        public int? PaymentId { get; set; }
        public bool AutoRenew { get; set; } = false;
        public bool RenewalReminderSent { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public virtual User User { get; set; } = null!;
        public virtual SubscriptionPlan Plan { get; set; } = null!;
        public virtual Payment? Payment { get; set; }
    }
}

