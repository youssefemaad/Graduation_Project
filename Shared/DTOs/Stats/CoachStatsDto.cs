namespace Shared.DTOs.Stats
{
    public class CoachStatsDto
    {
        public int CoachId { get; set; }
        public string CoachName { get; set; } = null!;
        public int TotalClients { get; set; }
        public int ActiveWorkoutPlans { get; set; }
        public int ActiveNutritionPlans { get; set; }
        public int TotalBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int UpcomingBookings { get; set; }
        public decimal AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public decimal TotalEarnings { get; set; }
        public int TokensEarned { get; set; }
        public DateTime? NextBookingDate { get; set; }
    }
}
