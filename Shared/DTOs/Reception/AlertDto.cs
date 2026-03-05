namespace Shared.DTOs.Reception
{
    public class AlertDto
    {
        public int AlertId { get; set; }
        public string Type { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Severity { get; set; } = "info";
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
