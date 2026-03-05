using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Equipment;

namespace Service.Services
{
    public class EquipmentService : IEquipmentService
    {
        private readonly IUnitOfWork _unitOfWork;

        public EquipmentService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<EquipmentDto>> GetAllEquipmentAsync()
        {
            var equipment = await _unitOfWork.Repository<Equipment>().GetAllAsync();
            var equipmentDtos = new List<EquipmentDto>();

            foreach (var item in equipment)
            {
                var dto = await MapToEquipmentDtoAsync(item);
                equipmentDtos.Add(dto);
            }

            return equipmentDtos;
        }

        public async Task<IEnumerable<EquipmentDto>> GetAvailableEquipmentAsync()
        {
            var equipment = await _unitOfWork.Repository<Equipment>()
                .FindAsync(e => e.Status == EquipmentStatus.Available);

            var equipmentDtos = new List<EquipmentDto>();
            foreach (var item in equipment)
            {
                var dto = await MapToEquipmentDtoAsync(item);
                equipmentDtos.Add(dto);
            }

            return equipmentDtos;
        }

        public async Task<EquipmentDto?> GetEquipmentByIdAsync(int equipmentId)
        {
            var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);
            return equipment == null ? null : await MapToEquipmentDtoAsync(equipment);
        }

        public async Task<EquipmentDto> UpdateEquipmentStatusAsync(int equipmentId, int status)
        {
            var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);

            if (equipment == null)
            {
                throw new KeyNotFoundException($"Equipment with ID {equipmentId} not found");
            }

            equipment.Status = (EquipmentStatus)status;
            equipment.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Equipment>().Update(equipment);
            await _unitOfWork.SaveChangesAsync();

            return await MapToEquipmentDtoAsync(equipment);
        }

        private async Task<EquipmentDto> MapToEquipmentDtoAsync(Equipment equipment)
        {
            var category = await _unitOfWork.Repository<EquipmentCategory>()
                .GetByIdAsync(equipment.CategoryId);

            return new EquipmentDto
            {
                EquipmentId = equipment.EquipmentId,
                Name = equipment.Name,
                CategoryId = equipment.CategoryId,
                CategoryName = category?.CategoryName,
                Status = (int)equipment.Status,
                StatusText = equipment.Status.ToString(),
                Location = equipment.Location,
                LastMaintenanceDate = equipment.LastMaintenanceDate,
                NextMaintenanceDate = equipment.NextMaintenanceDate,
                TokensCostPerHour = equipment.BookingCostTokens
            };
        }
    }
}
