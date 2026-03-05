namespace Shared.DTOs.Stats
{
    public class ReceptionStatsDto
    {
        public int TotalMembers { get; set; }
        public int ActiveMembers { get; set; }
        public int TodayCheckIns { get; set; }
        public int TodayBookings { get; set; }
        public int PendingBookings { get; set; }
        public int AvailableEquipment { get; set; }
        public int InUseEquipment { get; set; }
        public int MaintenanceEquipment { get; set; }
        public int TodayInBodyTests { get; set; }
        public decimal TodayRevenue { get; set; }
        public int ActiveSubscriptions { get; set; }
        public int ExpiringSubscriptions { get; set; }
    }
}
