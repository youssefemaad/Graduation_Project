namespace Shared.DTOs.Booking
{
    public class BookingDto
    {
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = null!;
        public int? EquipmentId { get; set; }
        public string? EquipmentName { get; set; }
        public int? CoachId { get; set; }
        public string? CoachName { get; set; }
        public int? CoachUserId { get; set; } // User ID for chat functionality
        public string BookingType { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int Status { get; set; }
        public string StatusText { get; set; } = null!;
        public int TokensCost { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        
        // Coach Session Equipment Tracking
        public bool IsAutoBookedForCoachSession { get; set; }
        public int? ParentCoachBookingId { get; set; }
        public bool IsAiGenerated { get; set; }
    }
}

