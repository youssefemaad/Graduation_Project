namespace Shared.DTOs.Payment
{
    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = null!;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public int Status { get; set; }
        public string StatusText { get; set; } = null!;
        public string? TransactionId { get; set; }
        public DateTime PaymentDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
