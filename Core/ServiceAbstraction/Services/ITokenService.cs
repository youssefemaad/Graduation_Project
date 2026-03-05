namespace ServiceAbstraction.Services
{
    public interface ITokenService
    {
        string GenerateJwtToken(int userId, string email, string role);
        int? ValidateToken(string token);
    }
}
