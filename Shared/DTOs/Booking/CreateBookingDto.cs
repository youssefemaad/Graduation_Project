using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Booking
{
    public class CreateBookingDto
    {
        [Required]
        public int UserId { get; set; }

        public int? EquipmentId { get; set; }
        public int? CoachId { get; set; }

        [Required]
        public string BookingType { get; set; } = null!;

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        public string? Notes { get; set; }
    }
}
