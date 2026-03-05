namespace IntelliFit.Shared.DTOs.AI
{
    public class AiWorkflowJobDto
    {
        public int JobId { get; set; }
        public int UserId { get; set; }
        public string JobType { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? RequestPayload { get; set; }
        public string? ResponsePayload { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAiWorkflowJobDto
    {
        public string JobType { get; set; } = null!;
        public string? RequestPayload { get; set; }
    }

    public class UpdateAiWorkflowJobDto
    {
        public string Status { get; set; } = null!;
        public string? ResponsePayload { get; set; }
    }
}
