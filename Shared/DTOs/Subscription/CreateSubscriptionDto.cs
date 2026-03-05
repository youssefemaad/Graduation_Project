using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Subscription
{
    public class CreateSubscriptionDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int PlanId { get; set; }

        [Required]
        public int PaymentId { get; set; }
    }
}
