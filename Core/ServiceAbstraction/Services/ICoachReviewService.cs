using IntelliFit.Shared.DTOs.User;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface ICoachReviewService
    {
        Task<CoachReviewDto> CreateReviewAsync(int userId, CreateCoachReviewDto dto);
        Task<CoachReviewDto> GetReviewByIdAsync(int reviewId);
        Task<IEnumerable<CoachReviewDto>> GetCoachReviewsAsync(int coachId);
        Task<CoachReviewDto> UpdateReviewAsync(int reviewId, int userId, UpdateCoachReviewDto dto);
        Task DeleteReviewAsync(int reviewId, int userId);
        Task<double> GetCoachAverageRatingAsync(int coachId);
    }
}
