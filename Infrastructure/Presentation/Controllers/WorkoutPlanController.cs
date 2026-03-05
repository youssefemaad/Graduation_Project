using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;
using Shared.DTOs.WorkoutPlan;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/workout-plans")]
    public class WorkoutPlanController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get All Templates

        [HttpGet("templates")]
        public async Task<IActionResult> GetAllTemplates()
        {
            var templates = await _serviceManager.WorkoutPlanService.GetAllTemplatesAsync();
            return Ok(templates);
        }

        #endregion

        #region Get Template By Id

        [HttpGet("templates/{id}")]
        public async Task<IActionResult> GetTemplateById(int id)
        {
            var template = await _serviceManager.WorkoutPlanService.GetPlanByIdAsync(id);
            return Ok(template);
        }

        #endregion

        #region Get Member Plans

        [HttpGet("member/{memberId}")]
        public async Task<IActionResult> GetMemberPlans(int memberId)
        {
            var plans = await _serviceManager.WorkoutPlanService.GetMemberPlansAsync(memberId);
            return Ok(plans);
        }

        #endregion

        #region Get Member Plan Details

        [HttpGet("{memberPlanId}")]
        public async Task<IActionResult> GetMemberPlanDetails(int memberPlanId)
        {
            var plan = await _serviceManager.WorkoutPlanService.GetMemberPlanDetailsAsync(memberPlanId);
            return Ok(plan);
        }

        #endregion

        #region Assign Plan To Member

        [HttpPost("assign")]
        public async Task<IActionResult> AssignPlanToMember([FromBody] AssignWorkoutPlanDto assignDto)
        {
            var assignedPlan = await _serviceManager.WorkoutPlanService.AssignPlanToMemberAsync(assignDto);
            return CreatedAtAction(nameof(GetMemberPlanDetails), new { memberPlanId = assignedPlan.MemberPlanId }, assignedPlan);
        }

        #endregion

        #region Update Progress

        [HttpPut("{memberPlanId}/progress")]
        public async Task<IActionResult> UpdateProgress(int memberPlanId, [FromBody] UpdateProgressDto progressDto)
        {
            var updatedPlan = await _serviceManager.WorkoutPlanService.UpdateProgressAsync(memberPlanId, progressDto);
            return Ok(updatedPlan);
        }

        #endregion

        #region Complete Plan

        [HttpPut("{memberPlanId}/complete")]
        public async Task<IActionResult> CompletePlan(int memberPlanId)
        {
            var completedPlan = await _serviceManager.WorkoutPlanService.CompletePlanAsync(memberPlanId);
            return Ok(completedPlan);
        }

        #endregion
    }
}
