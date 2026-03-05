using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.AI
{
    public class AIChatRequestDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public string Query { get; set; } = null!;

        public List<string>? ContentTypes { get; set; }
    }
}
