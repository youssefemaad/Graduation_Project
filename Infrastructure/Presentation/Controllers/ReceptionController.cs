using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Reception;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/reception")]
    public class ReceptionController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get Member for Check-In

        /// <summary>
        /// Get member details for check-in by user ID
        /// </summary>
        [HttpGet("member/{userId}")]
        public async Task<IActionResult> GetMemberForCheckIn(int userId)
        {
            var member = await _serviceManager.ReceptionService.GetMemberForCheckInAsync(userId);
            if (member == null)
            {
                return NotFound(new { message = "Member not found or inactive" });
            }
            return Ok(member);
        }

        #endregion

        #region QR Code Check-In

        /// <summary>
        /// Get member details by QR code scan
        /// </summary>
        [HttpGet("qr/{qrCode}")]
        public async Task<IActionResult> GetMemberByQRCode(string qrCode)
        {
            var member = await _serviceManager.ReceptionService.GetMemberByQRCodeAsync(qrCode);
            if (member == null)
            {
                return NotFound(new { message = "Invalid QR code or member not found" });
            }
            return Ok(member);
        }

        #endregion

        #region Search Members

        /// <summary>
        /// Search members by name, email, or member ID
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchMembers([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Search query is required" });
            }

            var members = await _serviceManager.ReceptionService.SearchMembersAsync(query);
            return Ok(members);
        }

        /// <summary>
        /// Get all members list with full details
        /// </summary>
        [HttpGet("members")]
        public async Task<IActionResult> GetAllMembers()
        {
            var members = await _serviceManager.ReceptionService.GetAllMembersAsync();
            return Ok(members);
        }

        /// <summary>
        /// Get member details by ID
        /// </summary>
        [HttpGet("members/{userId}")]
        public async Task<IActionResult> GetMemberDetails(int userId)
        {
            var member = await _serviceManager.ReceptionService.GetMemberDetailsAsync(userId);
            if (member == null)
            {
                return NotFound(new { message = "Member not found" });
            }
            return Ok(member);
        }

        #endregion

        #region Check-In Member

        /// <summary>
        /// Check in a member
        /// </summary>
        [HttpPost("checkin")]
        public async Task<IActionResult> CheckInMember([FromBody] CheckInRequestDto request)
        {
            var result = await _serviceManager.ReceptionService.CheckInMemberAsync(request);
            if (!result)
            {
                return BadRequest(new { message = "Failed to check in member" });
            }
            return Ok(new { message = "Member checked in successfully" });
        }

        #endregion

        #region Check-Out Member

        /// <summary>
        /// Check out a member
        /// </summary>
        [HttpPost("checkout")]
        public async Task<IActionResult> CheckOutMember([FromBody] CheckOutRequestDto request)
        {
            var result = await _serviceManager.ReceptionService.CheckOutMemberAsync(request);
            if (!result)
            {
                return BadRequest(new { message = "Failed to check out member" });
            }
            return Ok(new { message = "Member checked out successfully" });
        }

        #endregion

        #region Live Activities

        /// <summary>
        /// Get live activity feed for reception dashboard
        /// </summary>
        [HttpGet("activities")]
        public async Task<IActionResult> GetLiveActivities([FromQuery] int limit = 20)
        {
            var activities = await _serviceManager.ReceptionService.GetLiveActivitiesAsync(limit);
            return Ok(activities);
        }

        #endregion

        #region Alerts

        /// <summary>
        /// Get active alerts for reception
        /// </summary>
        [HttpGet("alerts")]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _serviceManager.ReceptionService.GetActiveAlertsAsync();
            return Ok(alerts);
        }

        #endregion

        #region Reception Stats

        /// <summary>
        /// Get reception dashboard statistics
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetReceptionStats()
        {
            var stats = await _serviceManager.StatsService.GetReceptionStatsAsync();
            return Ok(stats);
        }

        #endregion

        #region Create Member

        /// <summary>
        /// Create a new member with subscription and payment
        /// </summary>
        [HttpPost("create-member")]
        public async Task<IActionResult> CreateMember([FromBody] CreateMemberDto createDto)
        {
            try
            {
                var result = await _serviceManager.ReceptionService.CreateMemberAsync(createDto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create member", details = ex.Message });
            }
        }

        #endregion
    }
}
