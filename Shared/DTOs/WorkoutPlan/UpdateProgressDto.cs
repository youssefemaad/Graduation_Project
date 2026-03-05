using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.WorkoutPlan
{
    public class UpdateProgressDto
    {
        [Required]
        [Range(0, int.MaxValue)]
        public int CompletedWorkouts { get; set; }
    }
}
