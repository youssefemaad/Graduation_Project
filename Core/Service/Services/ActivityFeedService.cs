using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.User;
using AutoMapper;

namespace Service.Services
{
    public class ActivityFeedService : IActivityFeedService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ActivityFeedService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ActivityFeedDto> CreateActivityAsync(CreateActivityFeedDto dto)
        {
            var activity = _mapper.Map<ActivityFeed>(dto);

            await _unitOfWork.Repository<ActivityFeed>().AddAsync(activity);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDtoAsync(activity);
        }

        public async Task<IEnumerable<ActivityFeedDto>> GetUserActivitiesAsync(int userId, int limit = 50)
        {
            var activities = await _unitOfWork.Repository<ActivityFeed>().GetAllAsync();
            var userActivities = activities.Where(a => a.UserId == userId)
                                          .OrderByDescending(a => a.CreatedAt)
                                          .Take(limit);

            var activityDtos = new List<ActivityFeedDto>();
            foreach (var activity in userActivities)
            {
                activityDtos.Add(await MapToDtoAsync(activity));
            }
            return activityDtos;
        }

        public async Task<IEnumerable<ActivityFeedDto>> GetRecentActivitiesAsync(int limit = 100)
        {
            var activities = await _unitOfWork.Repository<ActivityFeed>().GetAllAsync();
            var recentActivities = activities.OrderByDescending(a => a.CreatedAt)
                                            .Take(limit);

            var activityDtos = new List<ActivityFeedDto>();
            foreach (var activity in recentActivities)
            {
                activityDtos.Add(await MapToDtoAsync(activity));
            }
            return activityDtos;
        }

        public async Task DeleteActivityAsync(int activityId)
        {
            var activity = await _unitOfWork.Repository<ActivityFeed>().GetByIdAsync(activityId);
            if (activity == null) return;

            _unitOfWork.Repository<ActivityFeed>().Remove(activity);
            await _unitOfWork.SaveChangesAsync();
        }

        private async Task<ActivityFeedDto> MapToDtoAsync(ActivityFeed activity)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(activity.UserId);

            var dto = _mapper.Map<ActivityFeedDto>(activity);
            dto.UserName = user?.Name;
            return dto;
        }
    }
}
