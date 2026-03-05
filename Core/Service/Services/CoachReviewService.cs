using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.User;
using AutoMapper;

namespace Service.Services
{
    public class CoachReviewService : ICoachReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CoachReviewService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<CoachReviewDto> CreateReviewAsync(int userId, CreateCoachReviewDto dto)
        {
            var review = _mapper.Map<CoachReview>(dto);
            review.UserId = userId;

            await _unitOfWork.Repository<CoachReview>().AddAsync(review);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDtoAsync(review);
        }

        public async Task<CoachReviewDto?> GetReviewByIdAsync(int reviewId)
        {
            var review = await _unitOfWork.Repository<CoachReview>().GetByIdAsync(reviewId);
            return review != null ? await MapToDtoAsync(review) : null;
        }

        public async Task<IEnumerable<CoachReviewDto>> GetCoachReviewsAsync(int coachId)
        {
            var reviews = await _unitOfWork.Repository<CoachReview>().GetAllAsync();
            var coachReviews = reviews.Where(r => r.CoachId == coachId)
                                     .OrderByDescending(r => r.CreatedAt);

            var reviewDtos = new List<CoachReviewDto>();
            foreach (var review in coachReviews)
            {
                reviewDtos.Add(await MapToDtoAsync(review));
            }
            return reviewDtos;
        }

        public async Task<CoachReviewDto?> UpdateReviewAsync(int reviewId, int userId, UpdateCoachReviewDto dto)
        {
            var review = await _unitOfWork.Repository<CoachReview>().GetByIdAsync(reviewId);
            if (review == null || review.UserId != userId) return null;

            _mapper.Map(dto, review);
            review.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<CoachReview>().Update(review);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDtoAsync(review);
        }

        public async Task DeleteReviewAsync(int reviewId, int userId)
        {
            var review = await _unitOfWork.Repository<CoachReview>().GetByIdAsync(reviewId);
            if (review == null || review.UserId != userId) return;

            _unitOfWork.Repository<CoachReview>().Remove(review);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<double> GetCoachAverageRatingAsync(int coachId)
        {
            var reviews = await _unitOfWork.Repository<CoachReview>().GetAllAsync();
            var coachReviews = reviews.Where(r => r.CoachId == coachId).ToList();

            if (!coachReviews.Any()) return 0;

            return coachReviews.Average(r => r.Rating);
        }

        private async Task<CoachReviewDto> MapToDtoAsync(CoachReview review)
        {
            var coach = await _unitOfWork.Repository<User>().GetByIdAsync(review.CoachId);
            var user = review.IsAnonymous ? null : await _unitOfWork.Repository<User>().GetByIdAsync(review.UserId);

            var dto = _mapper.Map<CoachReviewDto>(review);
            dto.CoachName = coach?.Name;
            dto.UserName = review.IsAnonymous ? "Anonymous" : user?.Name;
            return dto;
        }
    }
}
