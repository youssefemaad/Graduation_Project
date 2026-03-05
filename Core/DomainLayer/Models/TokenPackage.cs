using System;

namespace IntelliFit.Domain.Models
{
    public class TokenPackage
    {
        public int PackageId { get; set; }
        public string PackageName { get; set; } = null!;
        public int TokenAmount { get; set; }
        public decimal Price { get; set; }
        public int BonusTokens { get; set; } = 0;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}

