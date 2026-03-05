using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Tracks equipment availability for specific time slots throughout the day.
    /// This table resets daily at 12:00 AM and provides real-time availability to all users.
    /// </summary>
    public class EquipmentTimeSlot
    {
        public int SlotId { get; set; }
        public int EquipmentId { get; set; }
        public DateTime SlotDate { get; set; }  // The date this slot is for (without time)
        public TimeSpan StartTime { get; set; }  // Start time of the slot (e.g., 09:00)
        public TimeSpan EndTime { get; set; }    // End time of the slot (e.g., 10:00)
        public bool IsBooked { get; set; } = false;
        public int? BookedByUserId { get; set; }
        public int? BookingId { get; set; }  // Reference to the booking that reserved this slot
        public bool IsCoachSession { get; set; } = false;  // True if booked as part of a coach session
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? BookedAt { get; set; }

        // Navigation properties
        public virtual Equipment Equipment { get; set; } = null!;
        public virtual User? BookedByUser { get; set; }
        public virtual Booking? Booking { get; set; }
    }
}
