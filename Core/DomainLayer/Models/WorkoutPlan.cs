using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// AI-generated workout plans with full context for feedback loop and caching
    /// Stores both legacy coach-created plans and new AI-generated plans
    /// </summary>
    public class WorkoutPlan
    {
        public int PlanId { get; set; }
        public int UserId { get; set; }
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }

        // Legacy fields (for coach-created plans)
        public string PlanType { get; set; } = "Custom";
        public string? DifficultyLevel { get; set; }
        public int? DurationWeeks { get; set; }
        public string? Schedule { get; set; }
        public string? Exercises { get; set; }
        public int? GeneratedByCoachId { get; set; }
        public string? AiPrompt { get; set; }
        public string Status { get; set; } = "Draft";
        public string? ApprovalNotes { get; set; }
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int TokensSpent { get; set; } = 0;

        // NEW: AI-generated plan fields
        public string? FitnessLevel { get; set; } // Beginner, Intermediate, Advanced
        public string? Goal { get; set; } // Muscle, Strength, WeightLoss, Endurance
        public int? DaysPerWeek { get; set; }

        /// <summary>
        /// Full AI-generated plan structure as JSON (from Flan-T5)
        /// Contains: days, exercises, sets, reps, rest, progressive overload
        /// </summary>
        public string? PlanData { get; set; } // JSONB in database

        /// <summary>
        /// Request parameters that generated this plan (for cache key)
        /// Contains: equipment, injuries, preferences
        /// </summary>
        public string? RequestParameters { get; set; } // JSONB in database

        /// <summary>
        /// MD5/SHA256 hash of request parameters for quick cache lookup
        /// </summary>
        public string? RequestParametersHash { get; set; }

        /// <summary>
        /// Snapshot of user context at generation time
        /// Contains: InBody data, strength profile, muscle scan results
        /// Used to understand WHY this plan was generated this way
        /// </summary>
        public string? UserContextSnapshot { get; set; } // JSONB in database

        /// <summary>
        /// AI model version used for generation (e.g., "flan-t5-v1.2.0")
        /// </summary>
        public string? ModelVersion { get; set; }

        /// <summary>
        /// Time taken to generate plan in milliseconds (for monitoring)
        /// </summary>
        public int? GenerationLatencyMs { get; set; }

        // Plan status
        public bool IsActive { get; set; } = false;
        public bool IsCompleted { get; set; } = false;

        // Timestamps
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ActivatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual CoachProfile? Coach { get; set; }
        public virtual CoachProfile? ApprovedByCoach { get; set; }
        public virtual ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
        public virtual ICollection<AiProgramGeneration> AiGenerations { get; set; } = new List<AiProgramGeneration>();
        public virtual ICollection<WorkoutPlanExercise> WorkoutPlanExercises { get; set; } = new List<WorkoutPlanExercise>();

        // NEW: AI feedback loop navigation properties
        public virtual ICollection<WorkoutFeedback> WorkoutFeedbacks { get; set; } = new List<WorkoutFeedback>();
    }
}
