namespace Shared.DTOs.AI
{
    public class AIChatResponseDto
    {
        public string Response { get; set; } = null!;
        public int TokensUsed { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
