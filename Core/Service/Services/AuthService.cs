using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Auth;
using Shared.DTOs.User;
using BCrypt.Net;

namespace Service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenService _tokenService;

        public AuthService(IUnitOfWork unitOfWork, ITokenService tokenService)
        {
            _unitOfWork = unitOfWork;
            _tokenService = tokenService;
        }

        // Ensure DateTime values persisted to PostgreSQL with timestamptz are UTC
        private DateTime? EnsureUtc(DateTime? value)
        {
            if (!value.HasValue) return null;
            var dt = value.Value;
            if (dt.Kind == DateTimeKind.Utc) return dt;
            if (dt.Kind == DateTimeKind.Unspecified)
            {
                // Treat unspecified as UTC for storage consistency
                return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }
            // Local -> convert to UTC
            return dt.ToUniversalTime();
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginDto)
        {
            var user = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException("Account is deactivated");
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(user.UserId, user.Email, user.Role.ToString());

            return new AuthResponseDto
            {
                User = MapToUserDto(user),
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }

        /// <summary>
        /// Public registration - always creates Member role
        /// </summary>
        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerDto)
        {
            if (await EmailExistsAsync(registerDto.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            // Public signup always creates Member role (security requirement)
            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Name = registerDto.Name,
                Phone = registerDto.Phone,
                DateOfBirth = EnsureUtc(registerDto.DateOfBirth),
                Gender = registerDto.Gender.HasValue ? (GenderType)registerDto.Gender.Value : null,
                Role = UserRole.Member, // Always Member for public signup
                IsActive = true,
                MustChangePassword = false, // Members set their own password during signup
                IsFirstLogin = false, // Members enter their data during signup
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<User>().AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // Create MemberProfile for the new member
            var memberProfile = new MemberProfile
            {
                UserId = user.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Repository<MemberProfile>().AddAsync(memberProfile);
            await _unitOfWork.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(user.UserId, user.Email, user.Role.ToString());

            return new AuthResponseDto
            {
                User = MapToUserDto(user),
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }

        /// <summary>
        /// Admin-only registration - can create any role
        /// </summary>
        public async Task<AuthResponseDto> CreateUserWithRoleAsync(RegisterRequestDto registerDto, string role)
        {
            if (await EmailExistsAsync(registerDto.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            // Parse the role
            if (!Enum.TryParse<UserRole>(role, true, out var userRole))
            {
                throw new InvalidOperationException($"Invalid role: {role}");
            }

            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Name = registerDto.Name,
                Phone = registerDto.Phone,
                DateOfBirth = EnsureUtc(registerDto.DateOfBirth),
                Gender = registerDto.Gender.HasValue ? (GenderType)registerDto.Gender.Value : null,
                Role = userRole,
                IsActive = true,
                // Admin-created accounts must change password and complete profile on first login
                MustChangePassword = userRole != UserRole.Member,
                IsFirstLogin = userRole != UserRole.Member,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<User>().AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // Create appropriate profile based on role
            if (userRole == UserRole.Member)
            {
                var memberProfile = new MemberProfile
                {
                    UserId = user.UserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _unitOfWork.Repository<MemberProfile>().AddAsync(memberProfile);
            }
            else if (userRole == UserRole.Coach)
            {
                var coachProfile = new CoachProfile
                {
                    UserId = user.UserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _unitOfWork.Repository<CoachProfile>().AddAsync(coachProfile);
            }

            await _unitOfWork.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(user.UserId, user.Email, user.Role.ToString());

            return new AuthResponseDto
            {
                User = MapToUserDto(user),
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _unitOfWork.Repository<User>().AnyAsync(u => u.Email == email);
        }

        public async Task<bool> VerifyPasswordAsync(string email, string password)
        {
            var user = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.Email == email);

            return user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        }

        /// <summary>
        /// Change password for a user (used for first-login password change)
        /// </summary>
        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Current password is incorrect");
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.MustChangePassword = false;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Complete first login setup (marks IsFirstLogin as false)
        /// </summary>
        public async Task<UserDto> CompleteFirstLoginSetupAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            user.IsFirstLogin = false;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return MapToUserDto(user);
        }

        private UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                Email = user.Email,
                Name = user.Name,
                Phone = user.Phone,
                DateOfBirth = user.DateOfBirth,
                Gender = user.Gender.HasValue ? (int)user.Gender.Value : null,
                Role = user.Role.ToString(),
                ProfileImageUrl = user.ProfileImageUrl,
                Address = user.Address,
                TokenBalance = user.TokenBalance,
                IsActive = user.IsActive,
                EmailVerified = user.EmailVerified,
                MustChangePassword = user.MustChangePassword,
                IsFirstLogin = user.IsFirstLogin,
                LastLoginAt = user.LastLoginAt,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
