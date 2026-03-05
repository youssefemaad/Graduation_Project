namespace Shared.DTOs.Stats
{
    public class MemberStatsDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = null!;
        public int TokenBalance { get; set; }
        public int TotalBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int ActiveWorkoutPlans { get; set; }
        public int ActiveNutritionPlans { get; set; }
        public int TotalWorkoutsCompleted { get; set; }
        public int InBodyMeasurements { get; set; }
        public decimal? CurrentWeight { get; set; }
        public decimal? CurrentBodyFat { get; set; }
        public decimal? LatestBmi { get; set; }
        public DateTime? LastInBodyDate { get; set; }
        public DateTime? LastBookingDate { get; set; }
        public int? ActiveSubscriptionId { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }
    }
}
