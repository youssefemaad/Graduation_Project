using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Reception
{
    public class CreateMemberDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Name is required")]
        [MinLength(2, ErrorMessage = "Name must be at least 2 characters")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "National ID is required")]
        [MinLength(6, ErrorMessage = "National ID must be at least 6 characters")]
        public string NationalId { get; set; } = null!;

        [Phone(ErrorMessage = "Invalid phone number")]
        public string? Phone { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public int? Gender { get; set; }

        public string? Address { get; set; }

        public string? EmergencyContactName { get; set; }

        public string? EmergencyContactPhone { get; set; }

        [Required(ErrorMessage = "Subscription plan is required")]
        public int PlanId { get; set; }

        [Required(ErrorMessage = "Payment method is required")]
        public string PaymentMethod { get; set; } = "Cash";

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }
    }

    public class CreateMemberResponseDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string MemberNumber { get; set; } = null!;
        public string SubscriptionPlan { get; set; } = null!;
        public DateTime SubscriptionEndDate { get; set; }
        public string Message { get; set; } = "Member created successfully";
    }
}
