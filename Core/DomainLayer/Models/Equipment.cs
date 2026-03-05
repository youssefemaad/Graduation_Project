using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class Equipment
    {
        public int EquipmentId { get; set; }
        public int CategoryId { get; set; }
        public string Name { get; set; } = null!;
        public string? Model { get; set; }
        public string? Manufacturer { get; set; }
        public string? SerialNumber { get; set; }
        public string? Location { get; set; }
        public EquipmentStatus Status { get; set; } = EquipmentStatus.Available;
        public int? ConditionRating { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
        public int BookingCostTokens { get; set; } = 0;
        public int? MaxBookingDurationMinutes { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual EquipmentCategory Category { get; set; } = null!;
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
