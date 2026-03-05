using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.InBody;

namespace Service.Services
{
    public class InBodyService : IInBodyService
    {
        private readonly IUnitOfWork _unitOfWork;

        public InBodyService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<InBodyMeasurementDto>> GetUserMeasurementsAsync(int userId)
        {
            var measurements = await _unitOfWork.Repository<InBodyMeasurement>()
                .FindAsync(m => m.UserId == userId);

            var measurementDtos = new List<InBodyMeasurementDto>();
            foreach (var measurement in measurements.OrderByDescending(m => m.MeasurementDate))
            {
                var dto = await MapToDto(measurement);
                measurementDtos.Add(dto);
            }

            return measurementDtos;
        }

        public async Task<InBodyMeasurementDto?> GetMeasurementByIdAsync(int measurementId)
        {
            var measurement = await _unitOfWork.Repository<InBodyMeasurement>()
                .GetByIdAsync(measurementId);

            return measurement == null ? null : await MapToDto(measurement);
        }

        public async Task<InBodyMeasurementDto> CreateMeasurementAsync(CreateInBodyMeasurementDto createDto)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(createDto.UserId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {createDto.UserId} not found");
            }

            var measurement = new InBodyMeasurement
            {
                UserId = createDto.UserId,
                Weight = createDto.Weight,
                Height = createDto.Height,
                BodyFatPercentage = createDto.BodyFatPercentage,
                MuscleMass = createDto.MuscleMass,
                BodyWaterPercentage = createDto.BodyWaterPercentage,
                Protein = createDto.Protein,
                Minerals = createDto.Minerals,
                VisceralFatLevel = createDto.VisceralFat.HasValue ? (int)createDto.VisceralFat.Value : null,
                Bmr = createDto.Bmr.HasValue ? (int)createDto.Bmr.Value : null,
                MetabolicAge = createDto.MetabolicAge,
                BodyType = createDto.BodyType,
                SegmentalRightArmLean = createDto.SegmentalRightArmLean,
                SegmentalRightArmFat = createDto.SegmentalRightArmFat,
                SegmentalLeftArmLean = createDto.SegmentalLeftArmLean,
                SegmentalLeftArmFat = createDto.SegmentalLeftArmFat,
                SegmentalTrunkLean = createDto.SegmentalTrunkLean,
                SegmentalTrunkFat = createDto.SegmentalTrunkFat,
                SegmentalRightLegLean = createDto.SegmentalRightLegLean,
                SegmentalRightLegFat = createDto.SegmentalRightLegFat,
                SegmentalLeftLegLean = createDto.SegmentalLeftLegLean,
                SegmentalLeftLegFat = createDto.SegmentalLeftLegFat,
                MeasuredBy = createDto.ConductedByReceptionId,
                Notes = createDto.Notes,
                MeasurementDate = createDto.MeasurementDate ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<InBodyMeasurement>().AddAsync(measurement);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDto(measurement);
        }

        public async Task<InBodyMeasurementDto?> GetLatestMeasurementAsync(int userId)
        {
            var measurements = await _unitOfWork.Repository<InBodyMeasurement>()
                .FindAsync(m => m.UserId == userId);

            var latest = measurements.OrderByDescending(m => m.MeasurementDate).FirstOrDefault();

            return latest == null ? null : await MapToDto(latest);
        }

        private async Task<InBodyMeasurementDto> MapToDto(InBodyMeasurement measurement)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(measurement.UserId);
            User? conductor = null;
            if (measurement.MeasuredBy.HasValue)
            {
                conductor = await _unitOfWork.Repository<User>().GetByIdAsync(measurement.MeasuredBy.Value);
            }

            // Calculate BMI if height is available
            decimal? bmi = null;
            if (measurement.Height.HasValue && measurement.Height.Value > 0)
            {
                var heightInMeters = measurement.Height.Value / 100;
                bmi = measurement.Weight / (heightInMeters * heightInMeters);
            }

            return new InBodyMeasurementDto
            {
                MeasurementId = measurement.MeasurementId,
                UserId = measurement.UserId,
                UserName = user?.Name ?? "Unknown",
                Weight = measurement.Weight,
                Height = measurement.Height ?? 0,
                BodyFatPercentage = measurement.BodyFatPercentage,
                MuscleMass = measurement.MuscleMass,
                BodyWaterPercentage = measurement.BodyWaterPercentage,
                Protein = measurement.Protein,
                Minerals = measurement.Minerals,
                VisceralFat = measurement.VisceralFatLevel,
                Bmi = bmi,
                Bmr = measurement.Bmr,
                MetabolicAge = measurement.MetabolicAge,
                BodyType = measurement.BodyType,
                SegmentalRightArmLean = measurement.SegmentalRightArmLean,
                SegmentalRightArmFat = measurement.SegmentalRightArmFat,
                SegmentalLeftArmLean = measurement.SegmentalLeftArmLean,
                SegmentalLeftArmFat = measurement.SegmentalLeftArmFat,
                SegmentalTrunkLean = measurement.SegmentalTrunkLean,
                SegmentalTrunkFat = measurement.SegmentalTrunkFat,
                SegmentalRightLegLean = measurement.SegmentalRightLegLean,
                SegmentalRightLegFat = measurement.SegmentalRightLegFat,
                SegmentalLeftLegLean = measurement.SegmentalLeftLegLean,
                SegmentalLeftLegFat = measurement.SegmentalLeftLegFat,
                ConductedByReceptionId = measurement.MeasuredBy,
                ConductedByName = conductor?.Name,
                Notes = measurement.Notes,
                MeasurementDate = measurement.MeasurementDate,
                CreatedAt = measurement.CreatedAt
            };
        }
    }
}
