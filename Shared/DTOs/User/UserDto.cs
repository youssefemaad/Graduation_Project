namespace Shared.DTOs.User
{
    public class UserDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int? Gender { get; set; }
        public string Role { get; set; } = null!;
        public string? ProfileImageUrl { get; set; }
        public string? Address { get; set; }
        public int TokenBalance { get; set; }
        public bool IsActive { get; set; }
        public bool EmailVerified { get; set; }
        public bool MustChangePassword { get; set; }
        public bool IsFirstLogin { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
