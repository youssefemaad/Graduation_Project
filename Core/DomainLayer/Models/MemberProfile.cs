using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Member-specific profile data linked to User via UserId
    /// </summary>
    public class MemberProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? FitnessGoal { get; set; }
        public string? MedicalConditions { get; set; }
        public string? Allergies { get; set; }
        public string? FitnessLevel { get; set; }
        public string? PreferredWorkoutTime { get; set; }
        public int? SubscriptionPlanId { get; set; }
        public DateTime? MembershipStartDate { get; set; }
        public DateTime? MembershipEndDate { get; set; }
        public decimal? CurrentWeight { get; set; }
        public decimal? TargetWeight { get; set; }
        public decimal? Height { get; set; }
        public int TotalWorkoutsCompleted { get; set; } = 0;
        public int TotalCaloriesBurned { get; set; } = 0;
        public string Achievements { get; set; } = "[]";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual SubscriptionPlan? SubscriptionPlan { get; set; }
    }
}

