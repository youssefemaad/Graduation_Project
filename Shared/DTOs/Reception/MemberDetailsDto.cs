namespace Shared.DTOs.Reception
{
    public class MemberDetailsDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string MemberNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string Status { get; set; } = "Active"; // Active, Expired, Frozen
        public bool IsCurrentlyInside { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? LastVisit { get; set; }

        // Membership Details
        public MembershipDetailsDto? Membership { get; set; }

        // Payment Summary
        public PaymentSummaryDto? Payments { get; set; }

        // Activity List
        public List<ActivityItemDto> Activities { get; set; } = new();

        // Notes
        public List<string> Notes { get; set; } = new();

        // Alerts
        public List<AlertItemDto> Alerts { get; set; } = new();
    }

    public class MembershipDetailsDto
    {
        public string PlanName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int DaysRemaining { get; set; }
        public string VisitsLeft { get; set; } = "Unlimited";
        public string Status { get; set; } = "Active";
    }

    public class PaymentSummaryDto
    {
        public decimal LastAmount { get; set; }
        public DateTime LastPaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public decimal OutstandingBalance { get; set; }
    }

    public class ActivityItemDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // check-in, check-out, payment, renewal
        public string Description { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class AlertItemDto
    {
        public string Type { get; set; } = "info"; // warning, danger, info
        public string Message { get; set; } = string.Empty;
    }
}
