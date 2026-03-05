using Shared.DTOs.Auth;
using Shared.DTOs.User;

namespace ServiceAbstraction.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginRequestDto loginDto);
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerDto);
        Task<AuthResponseDto> CreateUserWithRoleAsync(RegisterRequestDto registerDto, string role);
        Task<bool> EmailExistsAsync(string email);
        Task<bool> VerifyPasswordAsync(string email, string password);
        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<UserDto> CompleteFirstLoginSetupAsync(int userId);
    }
}
