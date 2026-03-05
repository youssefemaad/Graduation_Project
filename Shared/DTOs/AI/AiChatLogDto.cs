namespace IntelliFit.Shared.DTOs.AI
{
    public class AiChatLogDto
    {
        public int ChatId { get; set; }
        public int UserId { get; set; }
        public Guid SessionId { get; set; }
        public string MessageType { get; set; } = null!;
        public string MessageContent { get; set; } = null!;
        public int TokensUsed { get; set; }
        public string? AiModel { get; set; }
        public int? ResponseTimeMs { get; set; }
        public string? ContextData { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAiChatLogDto
    {
        public Guid SessionId { get; set; }
        public string MessageType { get; set; } = null!;
        public string MessageContent { get; set; } = null!;
        public int TokensUsed { get; set; }
        public string? AiModel { get; set; }
        public int? ResponseTimeMs { get; set; }
        public string? ContextData { get; set; }
    }
}
