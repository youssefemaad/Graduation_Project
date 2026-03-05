using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntelliFit.Domain.Models
{
    public class UserAIWorkoutPlan
    {
        [Key]
        public int PlanId { get; set; }
        public int UserId { get; set; }
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }
        public string? FitnessLevel { get; set; }
        public string? Goal { get; set; }
        public int? DaysPerWeek { get; set; }
        public int? ProgramDurationWeeks { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Active";
        public bool IsActive { get; set; } = true;

        // Metadata from generation
        public string? ModelVersion { get; set; }
        public int? GenerationLatencyMs { get; set; }
        public string? RawPlanDataJson { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        public virtual ICollection<UserAIWorkoutPlanDay> Days { get; set; } = new List<UserAIWorkoutPlanDay>();
    }
}
