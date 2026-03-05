namespace Shared.DTOs.Equipment
{
    public class EquipmentDto
    {
        public int EquipmentId { get; set; }
        public string Name { get; set; } = null!;
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int Status { get; set; }
        public string StatusText { get; set; } = null!;
        public string? Location { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
        public int TokensCostPerHour { get; set; }
    }
}
