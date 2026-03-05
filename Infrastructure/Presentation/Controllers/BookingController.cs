using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Booking;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/bookings")]
    public class BookingController(IServiceManager _serviceManager) : ApiControllerBase
    {

        #region Create Booking

        [HttpPost]
        public async Task<ActionResult<BookingDto>> CreateBooking([FromBody] CreateBookingDto createDto)
        {
            try
            {
                var booking = await _serviceManager.BookingService.CreateBookingAsync(createDto);
                return Ok(booking);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Get Booking

        [HttpGet("{id}")]
        public async Task<ActionResult<BookingDto>> GetBooking(int id)
        {
            var booking = await _serviceManager.BookingService.GetBookingByIdAsync(id);
            return Ok(booking);
        }

        #endregion

        #region Get All Bookings (for Receptionist)

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetAllBookings()
        {
            var bookings = await _serviceManager.BookingService.GetAllBookingsAsync();
            return Ok(bookings);
        }

        #endregion

        #region Get Bookings by Status

        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetBookingsByStatus(string status)
        {
            var bookings = await _serviceManager.BookingService.GetBookingsByStatusAsync(status);
            return Ok(bookings);
        }

        #endregion

        #region Get Todays Bookings

        [HttpGet("today")]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetTodaysBookings()
        {
            var bookings = await _serviceManager.BookingService.GetTodaysBookingsAsync();
            return Ok(bookings);
        }

        #endregion

        #region Get User Bookings

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetUserBookings(int userId)
        {
            var bookings = await _serviceManager.BookingService.GetUserBookingsAsync(userId);
            return Ok(bookings);
        }

        #endregion

        #region Get Coach Bookings

        [HttpGet("coach/{coachId}")]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetCoachBookings(
            int coachId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? DateTime.UtcNow.Date;
            var end = endDate ?? DateTime.UtcNow.Date.AddDays(30);
            var bookings = await _serviceManager.BookingService.GetCoachBookingsAsync(coachId, start, end);
            return Ok(bookings);
        }

        #endregion

        #region Confirm Booking

        [HttpPut("{id}/confirm")]
        public async Task<ActionResult<BookingDto>> ConfirmBooking(int id)
        {
            var booking = await _serviceManager.BookingService.ConfirmBookingAsync(id);
            return Ok(booking);
        }

        #endregion

        #region Cancel Booking

        [HttpPut("{id}/cancel")]
        public async Task<ActionResult<BookingDto>> CancelBooking(int id, [FromBody] string cancellationReason)
        {
            var booking = await _serviceManager.BookingService.CancelBookingAsync(id, cancellationReason);
            return Ok(booking);
        }

        #endregion

        #region Check In

        [HttpPut("{id}/checkin")]
        public async Task<ActionResult<BookingDto>> CheckIn(int id)
        {
            var booking = await _serviceManager.BookingService.CheckInAsync(id);
            return Ok(booking);
        }

        #endregion

        #region Check Out

        [HttpPut("{id}/checkout")]
        public async Task<ActionResult<BookingDto>> CheckOut(int id)
        {
            var booking = await _serviceManager.BookingService.CheckOutAsync(id);
            return Ok(booking);
        }

        #endregion

        #region Get Equipment Availability (Booked Slots)

        /// <summary>
        /// RULE 4 & 5: Get booked time slots for equipment to show availability
        /// Returns all booked slots for the equipment in the specified date range
        /// </summary>
        [HttpGet("equipment/{equipmentId}/booked-slots")]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetEquipmentBookedSlots(
            int equipmentId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? DateTime.UtcNow.Date;
            var end = endDate ?? DateTime.UtcNow.Date.AddDays(7); // Default to 1 week
            var bookedSlots = await _serviceManager.BookingService.GetEquipmentBookedSlotsAsync(equipmentId, start, end);
            return Ok(bookedSlots);
        }

        #endregion

        #region Check Equipment Availability

        /// <summary>
        /// Check if equipment is available for a specific time slot
        /// </summary>
        [HttpGet("equipment/{equipmentId}/available")]
        public async Task<ActionResult<bool>> IsEquipmentAvailable(
            int equipmentId,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            var isAvailable = await _serviceManager.BookingService.IsEquipmentAvailableAsync(equipmentId, startTime, endTime);
            return Ok(new { isAvailable, equipmentId, startTime, endTime });
        }

        #endregion

        #region Check User Coach Booking Status

        /// <summary>
        /// RULE 1: Check if user has active coach booking (to block manual equipment booking)
        /// </summary>
        [HttpGet("user/{userId}/has-coach-booking")]
        public async Task<ActionResult<bool>> UserHasActiveCoachBooking(
            int userId,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            var hasCoachBooking = await _serviceManager.BookingService.UserHasActiveCoachBookingAsync(userId, startTime, endTime);
            return Ok(new { hasCoachBooking, message = hasCoachBooking ? "User has active coach booking. Manual equipment booking is blocked." : "User can book equipment manually." });
        }

        #endregion

        #region Get Coach Session Equipment

        /// <summary>
        /// Get all auto-booked equipment for a coach session
        /// </summary>
        [HttpGet("{coachBookingId}/equipment")]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetCoachSessionEquipment(int coachBookingId)
        {
            var equipment = await _serviceManager.BookingService.GetCoachSessionEquipmentAsync(coachBookingId);
            return Ok(equipment);
        }

        #endregion
    }
}
