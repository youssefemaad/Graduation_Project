using System;

namespace IntelliFit.Domain.Models
{
    public class AiWorkflowJob
    {
        public int JobId { get; set; }
        public int UserId { get; set; }
        public string JobType { get; set; } = null!;
        public string Status { get; set; } = "Pending";
        public string? RequestPayload { get; set; }
        public string? ResponsePayload { get; set; }
        public string? N8nWorkflowId { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }

        public virtual User User { get; set; } = null!;
    }
}
