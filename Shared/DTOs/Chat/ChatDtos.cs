namespace Shared.DTOs.Chat
{
    /// <summary>
    /// DTO for chat message data
    /// </summary>
    public class ChatMessageDto
    {
        public int ChatMessageId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = null!;
        public int ReceiverId { get; set; }
        public string ReceiverName { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public string ConversationId { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public bool IsPermanent { get; set; }
    }

    /// <summary>
    /// DTO for sending a new message
    /// </summary>
    public class SendMessageDto
    {
        public int ReceiverId { get; set; }
        public string Message { get; set; } = null!;
    }

    /// <summary>
    /// DTO for conversation summary (used in conversation list)
    /// </summary>
    public class ConversationDto
    {
        public string ConversationId { get; set; } = null!;
        public int OtherUserId { get; set; }
        public string OtherUserName { get; set; } = null!;
        public string? OtherUserAvatar { get; set; }
        public string LastMessage { get; set; } = null!;
        public DateTime LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
        public bool IsOnline { get; set; }
    }

    /// <summary>
    /// DTO for real-time message payload via SignalR
    /// </summary>
    public class ChatMessagePayload
    {
        /// <summary>
        /// Unique message ID for deduplication on the client
        /// </summary>
        public int MessageId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = null!;
        public string Message { get; set; } = null!;
        public DateTime Timestamp { get; set; }
        public string ConversationId { get; set; } = null!;
    }
}
