using Shared.DTOs.Booking;
using Shared.Helpers;

namespace ServiceAbstraction.Services
{
    public interface IBookingService
    {
        Task<BookingDto> CreateBookingAsync(CreateBookingDto createDto);
        Task<BookingDto?> GetBookingByIdAsync(int bookingId);
        Task<IEnumerable<BookingDto>> GetUserBookingsAsync(int userId);
        Task<IEnumerable<BookingDto>> GetAllBookingsAsync();
        Task<IEnumerable<BookingDto>> GetBookingsByStatusAsync(string status);
        Task<IEnumerable<BookingDto>> GetTodaysBookingsAsync();
        Task<IEnumerable<BookingDto>> GetEquipmentBookingsAsync(int equipmentId, DateTime startDate, DateTime endDate);
        Task<IEnumerable<BookingDto>> GetCoachBookingsAsync(int coachId, DateTime startDate, DateTime endDate);
        Task<BookingDto> CancelBookingAsync(int bookingId, string cancellationReason);
        Task<BookingDto> ConfirmBookingAsync(int bookingId);
        Task<BookingDto> CheckInAsync(int bookingId);
        Task<BookingDto> CheckOutAsync(int bookingId);
        Task<bool> IsEquipmentAvailableAsync(int equipmentId, DateTime startTime, DateTime endTime);
        Task<bool> IsCoachAvailableAsync(int coachId, DateTime startTime, DateTime endTime);

        /// <summary>
        /// Get equipment booked time slots for availability display
        /// </summary>
        Task<IEnumerable<BookingDto>> GetEquipmentBookedSlotsAsync(int equipmentId, DateTime startDate, DateTime endDate);

        /// <summary>
        /// Check if user has any active coach bookings during the specified time
        /// Used to block manual equipment booking when user has coach session
        /// </summary>
        Task<bool> UserHasActiveCoachBookingAsync(int userId, DateTime startTime, DateTime endTime);

        /// <summary>
        /// Get all auto-booked equipment for a coach session
        /// </summary>
        Task<IEnumerable<BookingDto>> GetCoachSessionEquipmentAsync(int coachBookingId);
    }
}

