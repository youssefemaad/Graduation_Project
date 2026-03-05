using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.InBody
{
    public class CreateInBodyMeasurementDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [Range(0.1, 500.0)]
        public decimal Weight { get; set; }

        [Required]
        [Range(0.1, 300.0)]
        public decimal Height { get; set; }

        public decimal? BodyFatPercentage { get; set; }

        public decimal? MuscleMass { get; set; }

        public decimal? BodyWaterPercentage { get; set; }

        public decimal? Protein { get; set; }

        public decimal? Minerals { get; set; }

        public decimal? VisceralFat { get; set; }

        public decimal? Bmr { get; set; }

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

        public int? ConductedByReceptionId { get; set; }

        public string? Notes { get; set; }

        public DateTime? MeasurementDate { get; set; }
    }
}
