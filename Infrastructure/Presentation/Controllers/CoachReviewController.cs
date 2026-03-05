using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.User;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/coach-reviews")]
    public class CoachReviewController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Review

        [HttpPost]
        public async Task<ActionResult<CoachReviewDto>> CreateReview([FromBody] CreateCoachReviewDto dto)
        {
            var userId = GetUserIdFromToken();
            var review = await _serviceManager.CoachReviewService.CreateReviewAsync(userId, dto);
            return Ok(review);
        }

        #endregion

        #region Get Review

        [HttpGet("{id}")]
        public async Task<ActionResult<CoachReviewDto>> GetReview(int id)
        {
            var review = await _serviceManager.CoachReviewService.GetReviewByIdAsync(id);
            if (review == null) return NotFound();
            return Ok(review);
        }

        #endregion

        #region Get Coach Reviews

        [HttpGet("coach/{coachId}")]
        public async Task<ActionResult<IEnumerable<CoachReviewDto>>> GetCoachReviews(int coachId)
        {
            var reviews = await _serviceManager.CoachReviewService.GetCoachReviewsAsync(coachId);
            return Ok(reviews);
        }

        #endregion

        #region Get Coach Average Rating

        [HttpGet("coach/{coachId}/rating")]
        public async Task<ActionResult<double>> GetCoachAverageRating(int coachId)
        {
            var rating = await _serviceManager.CoachReviewService.GetCoachAverageRatingAsync(coachId);
            return Ok(rating);
        }

        #endregion

        #region Update Review

        [HttpPut("{id}")]
        public async Task<ActionResult<CoachReviewDto>> UpdateReview(int id, [FromBody] UpdateCoachReviewDto dto)
        {
            var userId = GetUserIdFromToken();
            var review = await _serviceManager.CoachReviewService.UpdateReviewAsync(id, userId, dto);
            if (review == null) return NotFound();
            return Ok(review);
        }

        #endregion

        #region Delete Review

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReview(int id)
        {
            var userId = GetUserIdFromToken();
            await _serviceManager.CoachReviewService.DeleteReviewAsync(id, userId);
            return NoContent();
        }

        #endregion
    }
}
