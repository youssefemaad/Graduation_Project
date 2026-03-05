namespace IntelliFit.Shared.DTOs.Payment
{
    public class TokenTransactionDto
    {
        public int TransactionId { get; set; }
        public int UserId { get; set; }
        public int Amount { get; set; }
        public string TransactionType { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
        public int BalanceBefore { get; set; }
        public int BalanceAfter { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateTokenTransactionDto
    {
        public int Amount { get; set; }
        public string TransactionType { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
    }
}
