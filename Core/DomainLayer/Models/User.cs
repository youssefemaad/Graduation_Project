using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// User entity - single table approach with Role column
    /// Role-specific data is stored in MemberProfile/CoachProfile tables
    /// </summary>
    public class User
    {
        public int UserId { get; set; }
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public GenderType? Gender { get; set; }

        /// <summary>
        /// User role - stored as string in database
        /// </summary>
        public UserRole Role { get; set; } = UserRole.Member;

        public string? ProfileImageUrl { get; set; }
        public string? Address { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public int TokenBalance { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public bool EmailVerified { get; set; } = false;

        /// <summary>
        /// Indicates if user must change password on next login (for admin-created accounts)
        /// </summary>
        public bool MustChangePassword { get; set; } = false;

        /// <summary>
        /// Indicates if this is the user's first login (for profile setup)
        /// </summary>
        public bool IsFirstLogin { get; set; } = true;

        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties (common to all user types)
        public virtual MemberProfile? MemberProfile { get; set; }
        public virtual CoachProfile? CoachProfile { get; set; }
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public virtual ICollection<UserSubscription> UserSubscriptions { get; set; } = new List<UserSubscription>();
        public virtual ICollection<TokenTransaction> TokenTransactions { get; set; } = new List<TokenTransaction>();
        public virtual ICollection<InBodyMeasurement> InBodyMeasurements { get; set; } = new List<InBodyMeasurement>();
        public virtual ICollection<WorkoutPlan> WorkoutPlans { get; set; } = new List<WorkoutPlan>();
        public virtual ICollection<NutritionPlan> NutritionPlans { get; set; } = new List<NutritionPlan>();
        public virtual ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
        public virtual ICollection<AiChatLog> AiChatLogs { get; set; } = new List<AiChatLog>();
        public virtual ICollection<AiProgramGeneration> AiProgramGenerations { get; set; } = new List<AiProgramGeneration>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<CoachReview> CoachReviews { get; set; } = new List<CoachReview>();
        public virtual ICollection<ActivityFeed> ActivityFeeds { get; set; } = new List<ActivityFeed>();
        public virtual ICollection<UserMilestone> UserMilestones { get; set; } = new List<UserMilestone>();
        public virtual ICollection<AiWorkflowJob> AiWorkflowJobs { get; set; } = new List<AiWorkflowJob>();

        // AI/ML navigation properties (v2.0.0)
        public virtual ICollection<UserAchievement> UserAchievements { get; set; } = new List<UserAchievement>();

        // NEW: AI Feedback Loop navigation properties (v2.0.1)
        /// <summary>
        /// User feedback submitted after workouts (drives AI learning)
        /// </summary>
        public virtual ICollection<WorkoutFeedback> WorkoutFeedbacks { get; set; } = new List<WorkoutFeedback>();

        /// <summary>
        /// AI-learned strength levels per exercise (updated from feedback)
        /// </summary>
        public virtual ICollection<UserStrengthProfile> StrengthProfiles { get; set; } = new List<UserStrengthProfile>();

        /// <summary>
        /// Body photo analysis results (CLIP model - identifies muscle weaknesses)
        /// </summary>
        public virtual ICollection<MuscleDevelopmentScan> MuscleScans { get; set; } = new List<MuscleDevelopmentScan>();
    }
}
