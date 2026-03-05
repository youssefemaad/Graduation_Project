using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.WorkoutPlan;
using AutoMapper;

namespace Service.Services
{
    public class WorkoutLogService : IWorkoutLogService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public WorkoutLogService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<WorkoutLogDto> CreateWorkoutLogAsync(int userId, CreateWorkoutLogDto dto)
        {
            var workoutLog = _mapper.Map<WorkoutLog>(dto);
            workoutLog.UserId = userId;

            await _unitOfWork.Repository<WorkoutLog>().AddAsync(workoutLog);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<WorkoutLogDto>(workoutLog);
        }

        public async Task<WorkoutLogDto?> GetWorkoutLogByIdAsync(int logId)
        {
            var workoutLog = await _unitOfWork.Repository<WorkoutLog>().GetByIdAsync(logId);
            return workoutLog != null ? _mapper.Map<WorkoutLogDto>(workoutLog) : null;
        }

        public async Task<IEnumerable<WorkoutLogDto>> GetUserWorkoutLogsAsync(int userId)
        {
            var workoutLogs = await _unitOfWork.Repository<WorkoutLog>().GetAllAsync();
            var userLogs = workoutLogs.Where(w => w.UserId == userId)
                                      .OrderByDescending(w => w.WorkoutDate);
            return userLogs.Select(w => _mapper.Map<WorkoutLogDto>(w));
        }

        public async Task<IEnumerable<WorkoutLogDto>> GetWorkoutLogsByPlanAsync(int planId)
        {
            var workoutLogs = await _unitOfWork.Repository<WorkoutLog>().GetAllAsync();
            var planLogs = workoutLogs.Where(w => w.PlanId == planId)
                                      .OrderByDescending(w => w.WorkoutDate);
            return planLogs.Select(w => _mapper.Map<WorkoutLogDto>(w));
        }

        public async Task<WorkoutLogDto?> UpdateWorkoutLogAsync(int logId, UpdateWorkoutLogDto dto)
        {
            var workoutLog = await _unitOfWork.Repository<WorkoutLog>().GetByIdAsync(logId);
            if (workoutLog == null) return null;

            _mapper.Map(dto, workoutLog);
            _unitOfWork.Repository<WorkoutLog>().Update(workoutLog);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<WorkoutLogDto>(workoutLog);
        }

        public async Task DeleteWorkoutLogAsync(int logId)
        {
            var workoutLog = await _unitOfWork.Repository<WorkoutLog>().GetByIdAsync(logId);
            if (workoutLog == null) return;

            _unitOfWork.Repository<WorkoutLog>().Remove(workoutLog);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
