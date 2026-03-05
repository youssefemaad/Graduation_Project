namespace IntelliFit.Shared.DTOs.User
{
    public class CoachReviewDto
    {
        public int ReviewId { get; set; }
        public int CoachId { get; set; }
        public int UserId { get; set; }
        public int? BookingId { get; set; }
        public int Rating { get; set; }
        public string? ReviewText { get; set; }
        public bool IsAnonymous { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CoachName { get; set; }
        public string? UserName { get; set; }
    }

    public class CreateCoachReviewDto
    {
        public int CoachId { get; set; }
        public int? BookingId { get; set; }
        public int Rating { get; set; }
        public string? ReviewText { get; set; }
        public bool IsAnonymous { get; set; }
    }

    public class UpdateCoachReviewDto
    {
        public int? Rating { get; set; }
        public string? ReviewText { get; set; }
        public bool? IsAnonymous { get; set; }
    }
}
