using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Equipment;
using Shared.Helpers;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get Equipment
        /// <summary>
        /// Get all equipment
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<EquipmentDto>>>> GetAllEquipment()
        {
            try
            {
                var equipment = await _serviceManager.EquipmentService.GetAllEquipmentAsync();
                return Ok(ApiResponse<IEnumerable<EquipmentDto>>.SuccessResponse(equipment));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<EquipmentDto>>.ErrorResponse("Failed to retrieve equipment", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get available equipment only
        /// </summary>
        [HttpGet("available")]
        public async Task<ActionResult<ApiResponse<IEnumerable<EquipmentDto>>>> GetAvailableEquipment()
        {
            try
            {
                var equipment = await _serviceManager.EquipmentService.GetAvailableEquipmentAsync();
                return Ok(ApiResponse<IEnumerable<EquipmentDto>>.SuccessResponse(equipment));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<EquipmentDto>>.ErrorResponse("Failed to retrieve available equipment", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get equipment by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<EquipmentDto>>> GetEquipment(int id)
        {
            try
            {
                var equipment = await _serviceManager.EquipmentService.GetEquipmentByIdAsync(id);

                if (equipment == null)
                {
                    return NotFound(ApiResponse<EquipmentDto>.ErrorResponse("Equipment not found"));
                }

                return Ok(ApiResponse<EquipmentDto>.SuccessResponse(equipment));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<EquipmentDto>.ErrorResponse("Failed to retrieve equipment", new List<string> { ex.Message }));
            }
        }
        #endregion

        #region Update Equipment
        /// <summary>
        /// Update equipment status
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<EquipmentDto>>> UpdateEquipmentStatus(int id, [FromBody] int status)
        {
            try
            {
                var equipment = await _serviceManager.EquipmentService.UpdateEquipmentStatusAsync(id, status);
                return Ok(ApiResponse<EquipmentDto>.SuccessResponse(equipment, "Equipment status updated successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<EquipmentDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<EquipmentDto>.ErrorResponse("Failed to update equipment status", new List<string> { ex.Message }));
            }
        }
        #endregion
    }
}
