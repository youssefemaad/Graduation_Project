using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.AI;

namespace Service.Services
{
    public class AIChatService : IAIChatService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AIChatService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<AIChatResponseDto> SendMessageAsync(AIChatRequestDto request)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(request.UserId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {request.UserId} not found");
            }

            // Create a session ID if not provided
            var sessionId = Math.Abs((request.UserId.ToString() + DateTime.UtcNow.Ticks).GetHashCode());

            // Log the user's query
            var userChatLog = new AiChatLog
            {
                UserId = request.UserId,
                SessionId = sessionId,
                MessageType = "user",
                MessageContent = request.Query,
                TokensUsed = 0,
                ResponseTimeMs = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<AiChatLog>().AddAsync(userChatLog);

            // Generate placeholder response (actual AI integration will replace this)
            var responseText = "This is a placeholder AI response. Integration with actual AI service is pending.";
            var tokensUsed = 150;
            var responseTimeMs = 1500;

            // Log the AI response
            var aiChatLog = new AiChatLog
            {
                UserId = request.UserId,
                SessionId = sessionId,
                MessageType = "assistant",
                MessageContent = responseText,
                TokensUsed = tokensUsed,
                ResponseTimeMs = responseTimeMs,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<AiChatLog>().AddAsync(aiChatLog);
            await _unitOfWork.SaveChangesAsync();

            return new AIChatResponseDto
            {
                Response = responseText,
                TokensUsed = tokensUsed,
                Timestamp = aiChatLog.CreatedAt
            };
        }

        /// <summary>
        /// Save a chat interaction (both user message and AI response)
        /// </summary>
        public async Task SaveChatInteractionAsync(int userId, string userMessage, string aiResponse, int tokensUsed, int responseTimeMs, int sessionId)
        {
            var now = DateTime.UtcNow;

            // Save user message
            var userLog = new AiChatLog
            {
                UserId = userId,
                SessionId = sessionId,
                MessageType = "user",
                MessageContent = userMessage,
                TokensUsed = 0,
                ResponseTimeMs = 0,
                AiModel = "groq-llama",
                CreatedAt = now
            };

            // Save AI response
            var aiLog = new AiChatLog
            {
                UserId = userId,
                SessionId = sessionId,
                MessageType = "assistant",
                MessageContent = aiResponse,
                TokensUsed = tokensUsed,
                ResponseTimeMs = responseTimeMs,
                AiModel = "groq-llama",
                CreatedAt = now.AddMilliseconds(1) // Slight offset to ensure proper ordering
            };

            await _unitOfWork.Repository<AiChatLog>().AddAsync(userLog);
            await _unitOfWork.Repository<AiChatLog>().AddAsync(aiLog);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<object>> GetChatHistoryAsync(int userId, int limit = 50)
        {
            // Use FindAsync to filter at database level instead of loading all records
            var logs = await _unitOfWork.Repository<AiChatLog>()
                .FindAsync(l => l.UserId == userId);

            // Get user's chat logs ordered by creation time (newest first)
            // But keep message pairs together by ordering within each session
            return logs
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit * 2) // Take double since each conversation has user + assistant messages
                .OrderBy(l => l.CreatedAt) // Re-order chronologically for proper display
                .Select(l => new
                {
                    Role = l.MessageType,
                    Message = l.MessageContent,
                    TokensUsed = l.TokensUsed,
                    Timestamp = l.CreatedAt,
                    SessionId = l.SessionId
                })
                .ToList();
        }

        /// <summary>
        /// Get all chat sessions for a user with preview of the last message
        /// </summary>
        public async Task<IEnumerable<object>> GetChatSessionsAsync(int userId)
        {
            // Use FindAsync to filter at database level
            var logs = await _unitOfWork.Repository<AiChatLog>()
                .FindAsync(l => l.UserId == userId);

            var userLogs = logs.ToList();

            if (!userLogs.Any())
            {
                return new List<object>();
            }

            var groups = userLogs.GroupBy(l => l.SessionId).ToList();

            // Build session data with sorting info
            var sessionData = groups.Select(g =>
            {
                var orderedMessages = g.OrderBy(m => m.CreatedAt).ToList();
                var firstUserMessage = orderedMessages.FirstOrDefault(m => m.MessageType == "user");
                var title = firstUserMessage?.MessageContent ?? "Chat Session";

                if (title.Length > 50)
                {
                    title = title.Substring(0, 50) + "...";
                }

                var lastMsgAt = g.Max(m => m.CreatedAt);
                var createdAtTime = g.Min(m => m.CreatedAt);
                var messageCount = g.Count(m => m.MessageType == "user"); // Count only user messages

                return new
                {
                    sessionId = g.Key,
                    userId = userId,
                    title = title,
                    messageCount = messageCount,
                    lastMessageAt = lastMsgAt,
                    createdAt = createdAtTime
                };
            })
            .OrderByDescending(s => s.lastMessageAt)
            .ToList();

            return sessionData.Cast<object>().ToList();
        }

        /// <summary>
        /// Get all messages for a specific session
        /// Returns pairs of user messages and AI responses in format expected by frontend
        /// </summary>
        public async Task<IEnumerable<object>> GetSessionMessagesAsync(int userId, int sessionId)
        {
            // Use FindAsync to filter at database level
            var logs = await _unitOfWork.Repository<AiChatLog>()
                .FindAsync(l => l.UserId == userId && l.SessionId == sessionId);

            var sessionLogs = logs.OrderBy(l => l.CreatedAt).ToList();

            if (!sessionLogs.Any())
            {
                return new List<object>();
            }

            // Group user messages with their AI responses
            var messages = new List<object>();
            for (int i = 0; i < sessionLogs.Count; i++)
            {
                var userLog = sessionLogs[i];
                if (userLog.MessageType == "user" && i + 1 < sessionLogs.Count)
                {
                    var aiLog = sessionLogs[i + 1];
                    if (aiLog.MessageType == "assistant")
                    {
                        messages.Add(new
                        {
                            chatLogId = userLog.ChatId,
                            userId = userLog.UserId,
                            userMessage = userLog.MessageContent,
                            aiResponse = aiLog.MessageContent,
                            tokensUsed = aiLog.TokensUsed,
                            responseTimeMs = aiLog.ResponseTimeMs ?? 0,
                            sessionId = userLog.SessionId,
                            createdAt = userLog.CreatedAt
                        });
                        i++; // Skip the AI response since we've already processed it
                    }
                }
            }

            return messages;
        }
    }
}
