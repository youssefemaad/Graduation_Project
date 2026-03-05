using System;

namespace IntelliFit.Domain.Models
{
    public class InBodyMeasurement
    {
        public int MeasurementId { get; set; }
        public int UserId { get; set; }
        public DateTime MeasurementDate { get; set; } = DateTime.UtcNow;
        public decimal Weight { get; set; }
        public decimal? Height { get; set; }
        public decimal? BodyFatPercentage { get; set; }
        public decimal? MuscleMass { get; set; }
        public decimal? BodyWaterPercentage { get; set; }
        public decimal? Protein { get; set; }               // kg
        public decimal? Minerals { get; set; }              // kg
        public int? VisceralFatLevel { get; set; }
        public int? Bmr { get; set; }                       // kcal
        public int? MetabolicAge { get; set; }
        public string? BodyType { get; set; }

        // Segmental Lean Analysis
        public decimal? SegmentalRightArmLean { get; set; }
        public decimal? SegmentalRightArmFat { get; set; }
        public decimal? SegmentalLeftArmLean { get; set; }
        public decimal? SegmentalLeftArmFat { get; set; }
        public decimal? SegmentalTrunkLean { get; set; }
        public decimal? SegmentalTrunkFat { get; set; }
        public decimal? SegmentalRightLegLean { get; set; }
        public decimal? SegmentalRightLegFat { get; set; }
        public decimal? SegmentalLeftLegLean { get; set; }
        public decimal? SegmentalLeftLegFat { get; set; }

        public string? Notes { get; set; }
        public int? MeasuredBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual User? MeasuredByUser { get; set; }
    }
}
