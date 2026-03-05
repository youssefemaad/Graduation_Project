using Shared.DTOs.Reception;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface IReceptionService
    {
        Task<CheckInDto?> GetMemberForCheckInAsync(int userId);
        Task<CheckInDto?> GetMemberByQRCodeAsync(string qrCode);
        Task<IEnumerable<MemberSearchDto>> SearchMembersAsync(string searchTerm);
        Task<IEnumerable<MemberListDto>> GetAllMembersAsync();
        Task<MemberDetailsDto?> GetMemberDetailsAsync(int userId);
        Task<bool> CheckInMemberAsync(CheckInRequestDto request);
        Task<bool> CheckOutMemberAsync(CheckOutRequestDto request);
        Task<IEnumerable<LiveActivityDto>> GetLiveActivitiesAsync(int limit = 20);
        Task<IEnumerable<AlertDto>> GetActiveAlertsAsync();
        Task<CreateMemberResponseDto> CreateMemberAsync(CreateMemberDto createDto);
    }
}
