using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string PaymentMethod { get; set; } = null!;
        public string PaymentType { get; set; } = null!;
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string? TransactionReference { get; set; }
        public int? PackageId { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? InvoiceUrl { get; set; }
        public string? PaymentGateway { get; set; }
        public string? GatewayResponse { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual TokenPackage? Package { get; set; }
    }
}

