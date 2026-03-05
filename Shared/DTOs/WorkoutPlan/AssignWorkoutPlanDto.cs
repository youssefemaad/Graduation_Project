using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.WorkoutPlan
{
    public class AssignWorkoutPlanDto
    {
        [Required]
        public int MemberId { get; set; }

        [Required]
        public int PlanId { get; set; }

        public int? AssignedByCoachId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public string? Notes { get; set; }
    }
}
