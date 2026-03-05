using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.User
{
    public class UpdateProfileDto
    {
        [Required]
        [MinLength(2)]
        public string Name { get; set; } = null!;

        [Phone]
        public string? Phone { get; set; }

        public DateTime? DateOfBirth { get; set; }
        public int? Gender { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? Address { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
    }
}
