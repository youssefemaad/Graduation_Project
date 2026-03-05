using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Represents a chat message between users (member-coach communication)
    /// </summary>
    public class ChatMessage
    {
        public int ChatMessageId { get; set; }

        /// <summary>
        /// The user who sent the message
        /// </summary>
        public int SenderId { get; set; }

        /// <summary>
        /// The user who receives the message
        /// </summary>
        public int ReceiverId { get; set; }

        /// <summary>
        /// The message content
        /// </summary>
        public string Message { get; set; } = null!;

        /// <summary>
        /// Whether the message has been read by the receiver
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// When the message was read
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// Conversation identifier to group messages between two users
        /// Format: "min_userId-max_userId" for consistent grouping
        /// </summary>
        public string ConversationId { get; set; } = null!;

        /// <summary>
        /// When the message was sent
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the message expires (for cache cleanup)
        /// Default: 1 month from creation
        /// </summary>
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMonths(1);

        /// <summary>
        /// Whether this message should be permanently stored after expiry
        /// </summary>
        public bool IsPermanent { get; set; } = false;

        // Navigation properties
        public virtual User Sender { get; set; } = null!;
        public virtual User Receiver { get; set; } = null!;

        /// <summary>
        /// Helper method to generate consistent conversation ID
        /// </summary>
        public static string GenerateConversationId(int userId1, int userId2)
        {
            var minId = Math.Min(userId1, userId2);
            var maxId = Math.Max(userId1, userId2);
            return $"{minId}-{maxId}";
        }
    }
}
