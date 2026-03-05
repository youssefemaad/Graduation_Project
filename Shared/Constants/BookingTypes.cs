namespace IntelliFit.Shared.Constants
{
    /// <summary>
    /// Constants for booking types in the system.
    /// These values must match the standardized database values.
    /// </summary>
    public static class BookingTypes
    {
        /// <summary>
        /// Booking for equipment usage only (no coach involved)
        /// </summary>
        public const string Equipment = "Equipment";

        /// <summary>
        /// Booking for a personal training session with a coach
        /// </summary>
        public const string Session = "Session";

        /// <summary>
        /// Booking for an InBody body composition scan
        /// </summary>
        public const string InBody = "InBody";

        /// <summary>
        /// Validates if the given booking type is valid
        /// </summary>
        public static bool IsValid(string bookingType)
        {
            return bookingType == Equipment || bookingType == Session || bookingType == InBody;
        }

        /// <summary>
        /// Gets all valid booking types
        /// </summary>
        public static string[] GetAll() => new[] { Equipment, Session, InBody };
    }
}
