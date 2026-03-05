using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Name is required")]
        [MinLength(2, ErrorMessage = "Name must be at least 2 characters")]
        public string Name { get; set; } = null!;

        [Phone(ErrorMessage = "Invalid phone number")]
        public string? Phone { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public int? Gender { get; set; }
    }
}
