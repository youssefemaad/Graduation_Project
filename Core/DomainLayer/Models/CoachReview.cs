using System;

namespace IntelliFit.Domain.Models
{
    public class CoachReview
    {
        public int ReviewId { get; set; }
        public int CoachId { get; set; }
        public int UserId { get; set; }
        public int? BookingId { get; set; }
        public int Rating { get; set; }
        public string? ReviewText { get; set; }
        public bool IsAnonymous { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;


        // Navigation properties
        public virtual CoachProfile Coach { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual Booking? Booking { get; set; }
    }
}

