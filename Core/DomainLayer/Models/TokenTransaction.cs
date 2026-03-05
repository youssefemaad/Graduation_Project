using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class TokenTransaction
    {
        public int TransactionId { get; set; }
        public int UserId { get; set; }
        public int Amount { get; set; }
        public TransactionType TransactionType { get; set; }
        public string? Description { get; set; }
        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public int BalanceBefore { get; set; }
        public int BalanceAfter { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
    }
}
