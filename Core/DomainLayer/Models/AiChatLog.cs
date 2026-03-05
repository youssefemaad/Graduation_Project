using System;

namespace IntelliFit.Domain.Models
{
    public class AiChatLog
    {
        public int ChatId { get; set; }
        public int UserId { get; set; }
        public int SessionId { get; set; }
        public string MessageType { get; set; } = null!;
        public string MessageContent { get; set; } = null!;
        public int TokensUsed { get; set; } = 0;
        public string? AiModel { get; set; }
        public int? ResponseTimeMs { get; set; }
        public string? ContextData { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}

