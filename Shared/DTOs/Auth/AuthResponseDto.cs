using Shared.DTOs.User;

namespace Shared.DTOs.Auth
{
    public class AuthResponseDto
    {
        public UserDto User { get; set; } = null!;
        public string Token { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }
}
