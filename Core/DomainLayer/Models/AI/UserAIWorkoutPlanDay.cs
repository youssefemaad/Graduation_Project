using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntelliFit.Domain.Models
{
    public class UserAIWorkoutPlanDay
    {
        [Key]
        public int DayId { get; set; }
        public int PlanId { get; set; }

        public int DayNumber { get; set; } // 1..7 or 1..N
        public string? DayName { get; set; }
        public string? FocusAreas { get; set; } // Comma separated or JSON

        public int? EstimatedDurationMinutes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("PlanId")]
        public virtual UserAIWorkoutPlan Plan { get; set; } = null!;

        public virtual ICollection<UserAIWorkoutPlanExercise> Exercises { get; set; } = new List<UserAIWorkoutPlanExercise>();
    }
}
