using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using ServiceAbstraction.Services;

namespace Presentation.Controllers
{
    /// <summary>
    /// Controller for equipment time slot management and availability viewing.
    /// Equipment slots reset daily at 12:00 AM and are visible to all users.
    /// </summary>
    [Authorize]
    [Route("api/equipment-slots")]
    public class EquipmentTimeSlotController : ApiControllerBase
    {
        private readonly IEquipmentTimeSlotService _equipmentTimeSlotService;

        public EquipmentTimeSlotController(IServiceManager serviceManager)
        {
            // Access EquipmentTimeSlotService via reflection since it's not in IServiceManager directly
            // We'll need to inject it differently - for now, we'll use the booking service methods
            throw new NotImplementedException("EquipmentTimeSlotService needs to be exposed in IServiceManager");
        }
    }

    /// <summary>
    /// Temporary controller that uses BookingService for equipment availability
    /// until EquipmentTimeSlotService is properly exposed
    /// </summary>
    [Authorize]
    [Route("api/equipment-availability")]
    public class EquipmentAvailabilityController(IServiceManager _serviceManager) : ApiControllerBase
    {
        /// <summary>
        /// Get all booked time slots for an equipment on a specific date range.
        /// This shows when equipment is NOT available.
        /// </summary>
        [HttpGet("{equipmentId}/booked")]
        public async Task<IActionResult> GetBookedSlots(
            int equipmentId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? DateTime.UtcNow.Date;
            var end = endDate ?? DateTime.UtcNow.Date.AddDays(7);
            var bookedSlots = await _serviceManager.BookingService.GetEquipmentBookedSlotsAsync(equipmentId, start, end);
            
            return Ok(new
            {
                equipmentId,
                startDate = start,
                endDate = end,
                bookedSlots = bookedSlots.Select(b => new
                {
                    bookingId = b.BookingId,
                    startTime = b.StartTime,
                    endTime = b.EndTime,
                    isCoachSession = b.IsAutoBookedForCoachSession,
                    bookedByUserName = b.UserName
                })
            });
        }

        /// <summary>
        /// Check if equipment is available for a specific time slot
        /// </summary>
        [HttpGet("{equipmentId}/check")]
        public async Task<IActionResult> CheckAvailability(
            int equipmentId,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            var isAvailable = await _serviceManager.BookingService.IsEquipmentAvailableAsync(equipmentId, startTime, endTime);
            
            return Ok(new
            {
                equipmentId,
                startTime,
                endTime,
                isAvailable,
                message = isAvailable ? "Equipment is available for this time slot" : "Equipment is already booked for this time"
            });
        }

        /// <summary>
        /// Check if user can book equipment (not blocked by active coach session)
        /// </summary>
        [HttpGet("user/{userId}/can-book")]
        public async Task<IActionResult> CanUserBookEquipment(
            int userId,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            var hasCoachSession = await _serviceManager.BookingService.UserHasActiveCoachBookingAsync(userId, startTime, endTime);
            
            return Ok(new
            {
                userId,
                startTime,
                endTime,
                canBook = !hasCoachSession,
                hasActiveCoachSession = hasCoachSession,
                message = hasCoachSession 
                    ? "You cannot manually book equipment during your coach session. Equipment is automatically booked based on your workout plan."
                    : "You can book equipment for this time slot."
            });
        }
    }
}
