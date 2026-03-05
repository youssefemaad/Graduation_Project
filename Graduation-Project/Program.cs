using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Security.Claims;
using IntelliFit.Infrastructure.Persistence;
using IntelliFit.Infrastructure.Persistence.Repository;
using DomainLayer.Contracts;
using ServiceAbstraction.Services;
using Service.Services;
using Presentation.Controllers;

namespace Graduation_Project
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add DbContext
            builder.Services.AddDbContext<IntelliFitDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Add Repository Pattern (typed)
            builder.Services.AddScoped(typeof(IGenaricRepository<,>), typeof(GenericRepository<,>));
            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Add AutoMapper
            builder.Services.AddAutoMapper(typeof(Service.MappingProfiles.MappingProfile).Assembly);

            // Add Core Services (shared dependencies)
            builder.Services.AddScoped<ITokenService, TokenService>();

            // Add Distributed Cache (use in-memory cache for development, Redis for production)
            builder.Services.AddDistributedMemoryCache();
            builder.Services.AddMemoryCache(); // For EquipmentTimeSlotService caching
            // For production, use Redis:
            // For production, use Redis:
            // builder.Services.AddStackExchangeRedisCache(options =>
            // {
            //     options.Configuration = builder.Configuration.GetConnectionString("Redis");
            //     options.InstanceName = "IntelliFit:";
            // });

            // Add Chat Service
            builder.Services.AddScoped<IChatService, ChatService>();

            // Add Workout AI Services (Flan-T5 ML service integration)
            builder.Services.AddHttpClient<IMLServiceClient, MLServiceClient>(client =>
            {
                var baseUrl = builder.Configuration["MLService:BaseUrl"] ?? "http://localhost:5300";
                var timeout = int.Parse(builder.Configuration["MLService:TimeoutSeconds"] ?? "120");
                client.BaseAddress = new Uri(baseUrl);
                client.Timeout = TimeSpan.FromSeconds(timeout);
            });
            builder.Services.AddScoped<IWorkoutAIService, WorkoutAIService>();
            builder.Services.AddScoped<IWorkoutFeedbackService, WorkoutFeedbackService>();

            // Add Workout Plan Generator Service (Python FastAPI integration)
            builder.Services.AddHttpClient<ServiceAbstraction.Services.IWorkoutGeneratorService, Service.Services.WorkoutGeneratorService>(client =>
            {
                var baseUrl = builder.Configuration["WorkoutGeneratorAPI:BaseUrl"] ?? "http://localhost:8000";
                var timeout = int.Parse(builder.Configuration["WorkoutGeneratorAPI:TimeoutSeconds"] ?? "60");
                client.BaseAddress = new Uri(baseUrl);
                client.Timeout = TimeSpan.FromSeconds(timeout);
            });

            // Add Equipment Time Slot Service (for background service and booking logic)
            builder.Services.AddScoped<ServiceAbstraction.Services.IEquipmentTimeSlotService, Service.Services.EquipmentTimeSlotService>();

            // Add Service Manager (creates service instances internally with lazy loading - E-Commerce pattern)
            builder.Services.AddScoped<ServiceAbstraction.IServiceManager, Service.ServiceManager>();

            // RULE 5: Add Background Service for Daily Booking Cleanup
            builder.Services.AddHostedService<Service.BackgroundServices.BookingCleanupService>();

            // Add JWT Authentication with proper validation
            var jwtKey = builder.Configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured. Set Jwt:Key in appsettings or environment variables.");
            var jwtIssuer = builder.Configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException("JWT Issuer not configured.");
            var jwtAudience = builder.Configuration["Jwt:Audience"]
                ?? throw new InvalidOperationException("JWT Audience not configured.");

            // Validate key length for security
            if (jwtKey.Length < 32)
            {
                throw new InvalidOperationException("JWT Key must be at least 32 characters for security.");
            }

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = builder.Environment.IsProduction();
                options.SaveToken = true;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    // CRITICAL: Validate signature to prevent token tampering
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

                    // Validate issuer
                    ValidateIssuer = true,
                    ValidIssuer = jwtIssuer,

                    // Validate audience
                    ValidateAudience = true,
                    ValidAudience = jwtAudience,

                    // Validate token expiration
                    ValidateLifetime = true,

                    // No clock skew - tokens expire exactly at expiration time
                    ClockSkew = TimeSpan.Zero,

                    // Map name identifier claim for user ID extraction
                    NameClaimType = ClaimTypes.NameIdentifier,
                    RoleClaimType = ClaimTypes.Role
                };

                // Allow SignalR to use JWT token from query string
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    },
                    OnAuthenticationFailed = context =>
                    {
                        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                        logger.LogWarning("JWT Authentication failed: {Error}", context.Exception.Message);
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = context =>
                    {
                        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                        var userId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                  ?? context.Principal?.FindFirst("sub")?.Value;
                        logger.LogDebug("Token validated for user: {UserId}", userId);
                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddAuthorization();

            // Add CORS (Updated for SignalR - Allow all origins in development)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.SetIsOriginAllowed(_ => true) // Allow all origins in development
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials(); // Required for SignalR
                });
            });

            // Add SignalR
            builder.Services.AddSignalR();

            // Add Controllers from Presentation layer (explicitly reference Presentation assembly)
            builder.Services.AddControllers()
                .AddApplicationPart(typeof(AuthController).Assembly)
                .AddJsonOptions(options =>
                {
                    // Configure JSON serializer to use camelCase for property names (frontend compatibility)
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                    // Allow reading camelCase properties from frontend
                    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
                    // Configure JSON serializer to treat all DateTime as UTC for PostgreSQL compatibility
                    options.JsonSerializerOptions.Converters.Add(new IntelliFit.Shared.Helpers.UtcDateTimeConverter());
                });
            builder.Services.AddEndpointsApiExplorer();

            // Configure Swagger with JWT support
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "IntelliFit API",
                    Version = "v1",
                    Description = "Smart Gym Management System API"
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Enter 'Bearer' [space] and then your token"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            var app = builder.Build();

            // Fix users sequence on startup (one-time fix for seeded data)
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<IntelliFitDbContext>();
                try
                {
                    dbContext.Database.ExecuteSqlRaw("SELECT setval(pg_get_serial_sequence('users','UserId'), COALESCE((SELECT MAX(\"UserId\") FROM users), 1));");
                    Console.WriteLine("✓ Users sequence synchronized with max UserId");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Could not sync users sequence: {ex.Message}");
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseHttpsRedirection();
            }

            app.UseCors("AllowAll");

            app.UseStaticFiles();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Map SignalR Hubs
            app.MapHub<IntelliFit.Presentation.Hubs.NotificationHub>("/hubs/notifications");
            app.MapHub<IntelliFit.Presentation.Hubs.ChatHub>("/hubs/chat");

            app.Run();
        }
    }
}
