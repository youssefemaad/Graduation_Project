namespace Shared.DTOs.User
{
    public class CoachDto : UserDto
    {
        // Coach profile specific fields
        public int CoachProfileId { get; set; }
        public string? Specialization { get; set; }
        public string[]? Certifications { get; set; }
        public int? ExperienceYears { get; set; }
        public string? Bio { get; set; }
        public decimal? HourlyRate { get; set; }
        public decimal Rating { get; set; }
        public int TotalReviews { get; set; }
        public int TotalClients { get; set; }
        public string? AvailabilitySchedule { get; set; }
        public bool IsAvailable { get; set; }
    }
}
