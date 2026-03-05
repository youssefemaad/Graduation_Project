using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class Booking
    {
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public int? EquipmentId { get; set; }
        public int? CoachId { get; set; }
        public string BookingType { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public int TokensCost { get; set; } = 0;
        public string? Notes { get; set; }
        public string? CancellationReason { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Coach Session Equipment Tracking
        public bool IsAutoBookedForCoachSession { get; set; } = false;  // True if equipment auto-booked for coach session
        public int? ParentCoachBookingId { get; set; }  // Reference to parent coach booking (if auto-booked)
        public bool IsAiGenerated { get; set; } = false;  // True if booked by AI based on workout plan

        public virtual User User { get; set; } = null!;
        public virtual Equipment? Equipment { get; set; }
        public virtual CoachProfile? Coach { get; set; }
        public virtual Booking? ParentCoachBooking { get; set; }  // Parent coach session (for auto-booked equipment)
        public virtual ICollection<Booking> ChildEquipmentBookings { get; set; } = new List<Booking>();  // Child equipment bookings
        public virtual ICollection<EquipmentTimeSlot> EquipmentTimeSlots { get; set; } = new List<EquipmentTimeSlot>();
    }
}
