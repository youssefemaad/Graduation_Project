using Shared.DTOs.Booking;

namespace ServiceAbstraction.Services
{
    /// <summary>
    /// Service for managing equipment time slots with real-time availability tracking.
    /// Slots reset daily at 12:00 AM and availability is visible to all users.
    /// </summary>
    public interface IEquipmentTimeSlotService
    {
        /// <summary>
        /// Get all available time slots for an equipment on a specific date
        /// </summary>
        Task<IEnumerable<EquipmentTimeSlotDto>> GetAvailableSlotsAsync(int equipmentId, DateTime date);

        /// <summary>
        /// Get all booked time slots for an equipment on a specific date
        /// </summary>
        Task<IEnumerable<EquipmentTimeSlotDto>> GetBookedSlotsAsync(int equipmentId, DateTime date);

        /// <summary>
        /// Get all time slots (available and booked) for an equipment on a specific date
        /// </summary>
        Task<IEnumerable<EquipmentTimeSlotDto>> GetAllSlotsAsync(int equipmentId, DateTime date);

        /// <summary>
        /// Check if a specific time range is available for an equipment
        /// </summary>
        Task<bool> IsTimeRangeAvailableAsync(int equipmentId, DateTime startTime, DateTime endTime);

        /// <summary>
        /// Book a time slot for an equipment
        /// </summary>
        Task<EquipmentTimeSlotDto> BookSlotAsync(int equipmentId, int userId, DateTime startTime, DateTime endTime, int bookingId, bool isCoachSession = false);

        /// <summary>
        /// Cancel a booked time slot
        /// </summary>
        Task CancelSlotAsync(int slotId);

        /// <summary>
        /// Generate daily time slots for all equipment (called by background service at 12 AM)
        /// </summary>
        Task GenerateDailySlotsAsync(DateTime date);

        /// <summary>
        /// Clear expired time slots (called by background service)
        /// </summary>
        Task ClearExpiredSlotsAsync();

        /// <summary>
        /// Get equipment availability summary for a date range
        /// </summary>
        Task<IEnumerable<EquipmentAvailabilitySummaryDto>> GetEquipmentAvailabilitySummaryAsync(DateTime startDate, DateTime endDate);
    }

    /// <summary>
    /// DTO for equipment time slot information
    /// </summary>
    public class EquipmentTimeSlotDto
    {
        public int SlotId { get; set; }
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } = null!;
        public DateTime SlotDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsBooked { get; set; }
        public int? BookedByUserId { get; set; }
        public string? BookedByUserName { get; set; }
        public int? BookingId { get; set; }
        public bool IsCoachSession { get; set; }
        public DateTime? BookedAt { get; set; }
    }

    /// <summary>
    /// DTO for equipment availability summary
    /// </summary>
    public class EquipmentAvailabilitySummaryDto
    {
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } = null!;
        public DateTime Date { get; set; }
        public int TotalSlots { get; set; }
        public int AvailableSlots { get; set; }
        public int BookedSlots { get; set; }
        public List<TimeSlotInfo> AvailableTimeSlots { get; set; } = new();
        public List<TimeSlotInfo> BookedTimeSlots { get; set; } = new();
    }

    public class TimeSlotInfo
    {
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsCoachSession { get; set; }
        public string? BookedByUserName { get; set; }
    }
}
