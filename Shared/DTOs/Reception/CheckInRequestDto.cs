namespace Shared.DTOs.Reception
{
    public class CheckInRequestDto
    {
        public int UserId { get; set; }
        public string? AccessArea { get; set; }
        public string? Notes { get; set; }
    }

    public class CheckOutRequestDto
    {
        public int UserId { get; set; }
        public string? Notes { get; set; }
    }
}
