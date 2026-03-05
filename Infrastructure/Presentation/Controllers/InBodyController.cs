using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;
using Shared.DTOs.InBody;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/inbody")]
    public class InBodyController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get Measurements
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserMeasurements(int userId)
        {
            var measurements = await _serviceManager.InBodyService.GetUserMeasurementsAsync(userId);
            return Ok(measurements);
        }

        [HttpGet("{measurementId}")]
        public async Task<IActionResult> GetMeasurementById(int measurementId)
        {
            var measurement = await _serviceManager.InBodyService.GetMeasurementByIdAsync(measurementId);
            if (measurement == null)
            {
                return NotFound(new { message = "InBody measurement not found" });
            }
            return Ok(measurement);
        }

        [HttpGet("user/{userId}/latest")]
        public async Task<IActionResult> GetLatestMeasurement(int userId)
        {
            var measurement = await _serviceManager.InBodyService.GetLatestMeasurementAsync(userId);
            if (measurement == null)
            {
                return NotFound(new { message = "No measurements found for this user" });
            }
            return Ok(measurement);
        }
        #endregion

        #region Create Measurement
        [HttpPost]
        public async Task<IActionResult> CreateMeasurement([FromBody] CreateInBodyMeasurementDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var measurement = await _serviceManager.InBodyService.CreateMeasurementAsync(createDto);
                return CreatedAtAction(nameof(GetMeasurementById), new { measurementId = measurement.MeasurementId }, measurement);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        #endregion
    }
}
