using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.User;
using AutoMapper;

namespace Service.Services
{
    public class UserMilestoneService : IUserMilestoneService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UserMilestoneService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<UserMilestoneDto?> GetUserMilestoneAsync(int userId, int milestoneId)
        {
            var userMilestones = await _unitOfWork.Repository<UserMilestone>().GetAllAsync();
            var userMilestone = userMilestones.FirstOrDefault(um =>
                um.UserId == userId && um.MilestoneId == milestoneId);

            return userMilestone != null ? await MapToDtoAsync(userMilestone) : null;
        }

        public async Task<IEnumerable<UserMilestoneDto>> GetUserMilestonesAsync(int userId)
        {
            var userMilestones = await _unitOfWork.Repository<UserMilestone>().GetAllAsync();
            var userMilestonesList = userMilestones.Where(um => um.UserId == userId)
                                                   .OrderBy(um => um.IsCompleted)
                                                   .ThenByDescending(um => um.CreatedAt);

            var milestoneDtos = new List<UserMilestoneDto>();
            foreach (var userMilestone in userMilestonesList)
            {
                milestoneDtos.Add(await MapToDtoAsync(userMilestone));
            }
            return milestoneDtos;
        }

        public async Task<UserMilestoneDto?> UpdateMilestoneProgressAsync(int userId, UpdateUserMilestoneProgressDto dto)
        {
            var userMilestones = await _unitOfWork.Repository<UserMilestone>().GetAllAsync();
            var userMilestone = userMilestones.FirstOrDefault(um =>
                um.UserId == userId && um.MilestoneId == dto.MilestoneId);

            if (userMilestone == null) return null;

            _mapper.Map(dto, userMilestone);

            // Auto-complete if target reached
            var milestone = await _unitOfWork.Repository<ProgressMilestone>().GetByIdAsync(dto.MilestoneId);
            if (milestone?.TargetValue != null && userMilestone.CurrentProgress >= milestone.TargetValue && !userMilestone.IsCompleted)
            {
                userMilestone.IsCompleted = true;
                userMilestone.CompletedAt = DateTime.UtcNow;
            }

            _unitOfWork.Repository<UserMilestone>().Update(userMilestone);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDtoAsync(userMilestone);
        }

        public async Task<UserMilestoneDto?> CompleteMilestoneAsync(int userId, CompleteMilestoneDto dto)
        {
            var userMilestones = await _unitOfWork.Repository<UserMilestone>().GetAllAsync();
            var userMilestone = userMilestones.FirstOrDefault(um =>
                um.UserId == userId && um.MilestoneId == dto.MilestoneId);

            if (userMilestone == null) return null;

            _mapper.Map(dto, userMilestone);

            _unitOfWork.Repository<UserMilestone>().Update(userMilestone);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDtoAsync(userMilestone);
        }

        private async Task<UserMilestoneDto> MapToDtoAsync(UserMilestone userMilestone)
        {
            var milestone = await _unitOfWork.Repository<ProgressMilestone>().GetByIdAsync(userMilestone.MilestoneId);

            var dto = _mapper.Map<UserMilestoneDto>(userMilestone);
            dto.MilestoneName = milestone?.MilestoneName;
            dto.MilestoneDescription = milestone?.Description;
            dto.MilestoneTarget = milestone?.TargetValue;
            return dto;
        }
    }
}
