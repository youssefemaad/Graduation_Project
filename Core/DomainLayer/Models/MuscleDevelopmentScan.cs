using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Vision AI analysis of body photos to identify muscle development
    /// Uses CLIP model to score muscle groups and detect weaknesses
    /// Results used to personalize workout plans (focus on underdeveloped areas)
    /// </summary>
    public class MuscleDevelopmentScan
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        /// <summary>
        /// URL of uploaded body photo
        /// </summary>
        public string ImageUrl { get; set; } = null!;

        /// <summary>
        /// Type of photo: FullBody, Front, Back, Side
        /// </summary>
        public string ImageType { get; set; } = "FullBody";

        /// <summary>
        /// CLIP model scores per muscle group (0.0-1.0)
        /// Format: {
        ///   "chest": 0.75,
        ///   "back": 0.45,
        ///   "shoulders": 0.55,
        ///   "arms": 0.68,
        ///   "legs": 0.82,
        ///   "core": 0.60
        /// }
        /// </summary>
        public string? MuscleScores { get; set; } // JSONB in database

        /// <summary>
        /// Muscle groups scored below threshold (need more focus)
        /// </summary>
        public string[]? UnderdevelopedMuscles { get; set; } // Array in database

        /// <summary>
        /// Muscle groups scored above threshold (well developed)
        /// </summary>
        public string[]? WellDevelopedMuscles { get; set; } // Array in database

        /// <summary>
        /// Visual body fat estimate from CLIP analysis
        /// </summary>
        public decimal? BodyFatEstimate { get; set; }

        /// <summary>
        /// Overall muscle definition score (0.0-1.0)
        /// </summary>
        public decimal? MuscleDefinitionScore { get; set; }

        /// <summary>
        /// Notes about posture issues detected
        /// </summary>
        public string? PostureNotes { get; set; }

        /// <summary>
        /// Whether left/right muscle imbalance detected
        /// </summary>
        public bool AsymmetryDetected { get; set; } = false;

        /// <summary>
        /// Vision model version (e.g., "CLIP-vit-base-patch32")
        /// </summary>
        public string? ModelVersion { get; set; }

        /// <summary>
        /// AI confidence in analysis (0.0-1.0)
        /// </summary>
        public decimal? ConfidenceScore { get; set; }

        /// <summary>
        /// Time taken to process image (milliseconds)
        /// </summary>
        public int? ProcessingTimeMs { get; set; }

        public DateTime ScanDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}
