using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.WorkoutPlan;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/workout-templates")]
    public class WorkoutTemplateController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Template

        [HttpPost]
        [Authorize(Roles = "Coach")]
        public async Task<ActionResult<WorkoutTemplateDto>> CreateTemplate([FromBody] CreateWorkoutTemplateDto dto)
        {
            var coachId = GetUserIdFromToken();
            var template = await _serviceManager.WorkoutTemplateService.CreateTemplateAsync(coachId, dto);
            return Ok(template);
        }

        #endregion

        #region Get Template

        [HttpGet("{id}")]
        public async Task<ActionResult<WorkoutTemplateDto>> GetTemplate(int id)
        {
            var template = await _serviceManager.WorkoutTemplateService.GetTemplateByIdAsync(id);
            if (template == null) return NotFound();
            return Ok(template);
        }

        #endregion

        #region Get Coach Templates

        [HttpGet("coach/{coachId}")]
        public async Task<ActionResult<IEnumerable<WorkoutTemplateDto>>> GetCoachTemplates(int coachId)
        {
            var templates = await _serviceManager.WorkoutTemplateService.GetCoachTemplatesAsync(coachId);
            return Ok(templates);
        }

        #endregion

        #region Get Public Templates

        [HttpGet("public")]
        public async Task<ActionResult<IEnumerable<WorkoutTemplateDto>>> GetPublicTemplates()
        {
            var templates = await _serviceManager.WorkoutTemplateService.GetPublicTemplatesAsync();
            return Ok(templates);
        }

        #endregion

        #region Update Template

        [HttpPut("{id}")]
        [Authorize(Roles = "Coach")]
        public async Task<ActionResult<WorkoutTemplateDto>> UpdateTemplate(int id, [FromBody] UpdateWorkoutTemplateDto dto)
        {
            var coachId = GetUserIdFromToken();
            var template = await _serviceManager.WorkoutTemplateService.UpdateTemplateAsync(id, coachId, dto);
            if (template == null) return NotFound();
            return Ok(template);
        }

        #endregion

        #region Delete Template

        [HttpDelete("{id}")]
        [Authorize(Roles = "Coach")]
        public async Task<ActionResult> DeleteTemplate(int id)
        {
            var coachId = GetUserIdFromToken();
            await _serviceManager.WorkoutTemplateService.DeleteTemplateAsync(id, coachId);
            return NoContent();
        }

        #endregion
    }
}
