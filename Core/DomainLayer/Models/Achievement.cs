using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Defines available achievements in the system.
    /// Replaces the JSON string approach in MemberProfile for proper normalization.
    /// </summary>
    public class Achievement
    {
        public int AchievementId { get; set; }

        /// <summary>
        /// Unique code for the achievement (e.g., "FIRST_WORKOUT", "10_WORKOUTS", "STREAK_30")
        /// </summary>
        public string Code { get; set; } = null!;

        /// <summary>
        /// Display name
        /// </summary>
        public string Name { get; set; } = null!;

        /// <summary>
        /// Description of how to earn this achievement
        /// </summary>
        public string Description { get; set; } = null!;

        /// <summary>
        /// Category: "workout", "nutrition", "consistency", "social", "milestone"
        /// </summary>
        public string Category { get; set; } = null!;

        /// <summary>
        /// Icon identifier or URL
        /// </summary>
        public string? IconUrl { get; set; }

        /// <summary>
        /// Token reward for earning this achievement
        /// </summary>
        public int TokenReward { get; set; } = 0;

        /// <summary>
        /// XP points reward
        /// </summary>
        public int XpReward { get; set; } = 0;

        /// <summary>
        /// Threshold value to earn (e.g., 10 for "10 workouts")
        /// </summary>
        public int? ThresholdValue { get; set; }

        /// <summary>
        /// Is this a hidden/secret achievement?
        /// </summary>
        public bool IsSecret { get; set; } = false;

        /// <summary>
        /// Rarity tier: "common", "rare", "epic", "legendary"
        /// </summary>
        public string Rarity { get; set; } = "common";

        /// <summary>
        /// Display order in lists
        /// </summary>
        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual ICollection<UserAchievement> UserAchievements { get; set; } = new List<UserAchievement>();
    }

    /// <summary>
    /// Links users to their earned achievements with progress tracking.
    /// </summary>
    public class UserAchievement
    {
        public int UserAchievementId { get; set; }
        public int UserId { get; set; }
        public int AchievementId { get; set; }

        /// <summary>
        /// Current progress toward threshold (if applicable)
        /// </summary>
        public int CurrentProgress { get; set; } = 0;

        /// <summary>
        /// Has the achievement been earned?
        /// </summary>
        public bool IsEarned { get; set; } = false;

        /// <summary>
        /// When the achievement was earned
        /// </summary>
        public DateTime? EarnedAt { get; set; }

        /// <summary>
        /// Was the token reward claimed?
        /// </summary>
        public bool RewardClaimed { get; set; } = false;

        /// <summary>
        /// When rewards were claimed
        /// </summary>
        public DateTime? RewardClaimedAt { get; set; }

        /// <summary>
        /// Has the user seen/acknowledged this achievement?
        /// </summary>
        public bool IsNotified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual User User { get; set; } = null!;
        public virtual Achievement Achievement { get; set; } = null!;
    }
}
