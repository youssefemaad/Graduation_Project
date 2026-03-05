using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntelliFit.Domain.Models
{
    public class UserAIWorkoutPlanExercise
    {
        [Key]
        public int Id { get; set; }
        public int PlanDayId { get; set; }
        public int? ExerciseId { get; set; }  // FK to Exercise table (optional if not found)
        public string ExerciseName { get; set; } = null!;
        public int OrderInDay { get; set; }

        public string? Sets { get; set; } // Could be "4" or range "3-4"
        public string? Reps { get; set; } // "12" or "8-10"
        public string? Rest { get; set; } // "90s"
        public int? RestSeconds { get; set; }

        public decimal? WeightKg { get; set; }
        public string? WeightRecommendation { get; set; } // "Use 70% 1RM"

        public string? Notes { get; set; }
        public string? Tempo { get; set; }

        public int? EquipmentId { get; set; }
        public string? EquipmentRequired { get; set; }
        public string? TargetMuscle { get; set; }
        public string? ExerciseType { get; set; }
        public string? MovementPattern { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("PlanDayId")]
        public virtual UserAIWorkoutPlanDay Day { get; set; } = null!;

        [ForeignKey("ExerciseId")]
        public virtual Exercise? Exercise { get; set; }

        [ForeignKey("EquipmentId")]
        public virtual Equipment? Equipment { get; set; }
    }
}
