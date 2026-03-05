using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Links coach session bookings to the equipment that is automatically booked
    /// for that session based on the workout plan exercises.
    /// This ensures equipment is reserved for coach sessions and prevents
    /// manual booking of that equipment by other users.
    /// </summary>
    public class CoachSessionEquipment
    {
        public int Id { get; set; }
        public int CoachBookingId { get; set; }  // The coach session booking
        public int EquipmentBookingId { get; set; }  // The equipment booking created for this session
        public int EquipmentId { get; set; }
        public int? WorkoutPlanExerciseId { get; set; }  // Optional: which exercise this equipment is for
        public bool IsApprovedByCoach { get; set; } = false;  // Coach can approve/modify equipment
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Booking CoachBooking { get; set; } = null!;
        public virtual Booking EquipmentBooking { get; set; } = null!;
        public virtual Equipment Equipment { get; set; } = null!;
        public virtual WorkoutPlanExercise? WorkoutPlanExercise { get; set; }
    }
}
