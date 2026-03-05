using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Payment
{
    public class CreatePaymentDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = null!;

        public string PaymentType { get; set; } = "Subscription";

        public int? PackageId { get; set; }

        public string? TransactionId { get; set; }
    }
}
