using Shared.DTOs.InBody;

namespace ServiceAbstraction.Services
{
    public interface IInBodyService
    {
        Task<IEnumerable<InBodyMeasurementDto>> GetUserMeasurementsAsync(int userId);
        Task<InBodyMeasurementDto?> GetMeasurementByIdAsync(int measurementId);
        Task<InBodyMeasurementDto> CreateMeasurementAsync(CreateInBodyMeasurementDto createDto);
        Task<InBodyMeasurementDto?> GetLatestMeasurementAsync(int userId);
    }
}
