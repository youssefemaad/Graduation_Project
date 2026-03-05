# Shared Layer Analysis

## What Was Found

### Structure
```
Shared/
├── Shared.csproj              (targets net8.0, no external dependencies)
├── DTOs/                      (56 DTO files across 16 subfolders)
│   ├── AI/
│   │   ├── AIChatDto.cs
│   │   ├── AIChatSessionDto.cs
│   │   └── AIWorkoutPlanDto.cs
│   ├── Auth/
│   │   ├── AuthResponseDto.cs
│   │   ├── LoginDto.cs
│   │   ├── RegisterDto.cs
│   │   ├── CreateUserWithRoleDto.cs
│   │   ├── ChangePasswordDto.cs
│   │   └── CompleteSetupDto.cs (Member + Coach variants)
│   ├── Booking/
│   │   ├── BookingDto.cs
│   │   └── CreateBookingDto.cs
│   ├── Chat/
│   │   ├── ChatMessageDto.cs
│   │   └── ConversationDto.cs
│   ├── Equipment/
│   │   └── EquipmentDto.cs (+ related DTOs)
│   ├── Exercise/
│   │   └── ExerciseDto.cs
│   ├── InBody/
│   │   ├── InBodyMeasurementDto.cs
│   │   ├── CreateInBodyMeasurementDto.cs
│   │   └── InBodyProgressDto.cs
│   ├── Meal/
│   │   ├── MealDto.cs
│   │   ├── CreateMealDto.cs
│   │   └── MealIngredientDto.cs
│   ├── NutritionPlan/
│   │   └── NutritionPlanDto.cs (+ Create, Update)
│   ├── Payment/
│   │   ├── PaymentDto.cs
│   │   ├── CreatePaymentDto.cs
│   │   └── TokenTransactionDto.cs (+Create)
│   ├── Reception/
│   │   ├── CheckInMemberDto.cs
│   │   ├── CheckInRequestDto.cs
│   │   ├── CheckOutRequestDto.cs
│   │   ├── CreateMemberDto.cs
│   │   ├── LiveActivityDto.cs
│   │   ├── MemberCheckInDto.cs
│   │   ├── MemberDetailsDto.cs
│   │   ├── ReceptionAlertDto.cs
│   │   └── ReceptionStatsDto.cs
│   ├── Stats/
│   │   ├── MemberStatsDto.cs
│   │   ├── CoachStatsDto.cs
│   │   └── ReceptionStatsDto.cs  
│   ├── Subscription/
│   │   ├── SubscriptionPlanDto.cs
│   │   ├── CreateSubscriptionDto.cs
│   │   └── SubscriptionDto.cs
│   ├── User/
│   │   ├── UserDto.cs
│   │   ├── UpdateUserDto.cs
│   │   ├── CoachReviewDto.cs (+Create, Update)
│   │   ├── UserMetricsDto.cs
│   │   ├── UserAIContextDto.cs
│   │   ├── UserWorkoutSummaryDto.cs
│   │   ├── NotificationDto.cs (+Create)
│   │   ├── AuditLogDto.cs (+Create)
│   │   ├── ActivityFeedDto.cs (+Create)
│   │   ├── UserMilestoneDto.cs (+Update, Complete)
│   │   └── WorkoutLogDto.cs (+Create, Update)
│   ├── WorkoutAI/
│   │   └── MLWorkoutRequest.cs, MLWorkoutResponse.cs, MLHealthResponse.cs
│   ├── WorkoutPlan/
│   │   └── WorkoutPlanDto.cs, WorkoutTemplateDto.cs (+Create, Update, Exercise variants)
│   ├── AIGenerationDTOs.cs     (root level — WorkoutGenerationRequest/NutritionGenerationRequest)
│   └── WorkoutGeneratorDTOs.cs (root level — GenerateWorkoutRequest/Response)
├── Constants/
│   ├── BookingTypes.cs         (Equipment, Session, InBody)
│   └── ProgramTypes.cs         (Workout, Nutrition)
└── Helpers/
    ├── ApiResponse.cs          (ApiResponse<T> wrapper)
    ├── PaginatedResponse.cs    (PaginatedResponse<T> extends ApiResponse)
    └── UtcDateTimeConverter.cs (JSON converter for PostgreSQL UTC DateTime)
```

### DTO Organization
- **56 DTO files** across 16 subfolders — well-organized by domain 
- **Reception DTOs** — Most comprehensive (9 files), CRM-style member management
- **User DTOs** — Rich set (9 files) including AI context, metrics, workout summary
- **Auth DTOs** — Complete registration/login flow with role-based setup
- **WorkoutAI DTOs** — ML service request/response models
- **2 root-level DTO files** — `AIGenerationDTOs.cs`, `WorkoutGeneratorDTOs.cs` (not in subfolders)

### DTO Patterns Found
- Most DTOs are simple POCOs with auto-properties
- No validation attributes on any DTO (no `[Required]`, `[MaxLength]`, `[Range]`, `[EmailAddress]`)
- No nullability annotations (no `string?` vs `string` distinction)
- Some DTOs have computed properties (e.g., `ReceptionStatsDto.OccupancyRate`)
- `CompleteSetupDto` has member and coach-specific variants with complex nested data
- `CreateMemberDto` includes subscription + payment details (composite DTO for reception workflow)

### Helpers
- **`ApiResponse<T>`** — Standard wrapper: `bool Success`, `string Message`, `T? Data`, `List<string>? Errors`, static factory methods `Ok()`, `Fail()`
- **`PaginatedResponse<T>`** — Extends ApiResponse with `int TotalCount`, `int Page`, `int PageSize`, `int TotalPages`, `bool HasNext/HasPrevious`
- **`UtcDateTimeConverter`** — JSON converter that ensures DateTime values are treated as UTC (handles PostgreSQL's timestamp without time zone behavior)

### Constants
- **`BookingTypes`** — Static strings: "Equipment", "Session", "InBody"
- **`ProgramTypes`** — Static strings: "Workout", "Nutrition"

---

## What Is Missing

### Critical
1. **No validation attributes on ANY DTO** — All 56 DTOs lack `[Required]`, `[MaxLength]`, `[Range]`, `[EmailAddress]`, `[RegularExpression]` etc. Controllers receive unvalidated data
2. **No request/response separation** — Some DTOs serve as both input and output (ExerciseDto used for read and create). Should have separate Request/Response DTOs
3. **Inline DTOs elsewhere** — DTOs exist outside Shared/:
   - `IEquipmentTimeSlotService.cs` contains `TimeSlotDto`, `AvailableSlotDto`
   - `AIController.cs` contains `GeminiChatRequest`, `TestSaveRequest`
   - Various services create anonymous objects

### Missing DTOs
4. **No MemberProfileDto** — MemberProfile entity has no corresponding DTO
5. **No CoachProfileDto** — CoachProfile entity has no dedicated DTO (some data embedded in UserDto)
6. **No EquipmentCategoryDto** — EquipmentCategory entity has no DTO
7. **No EquipmentTimeSlotDto in Shared** — Exists only inside IEquipmentTimeSlotService
8. **No AttendanceLogDto** — AttendanceLog entity has no DTO
9. **No MilestoneDto** — Milestone entity has no DTO (only UserMilestoneDto exists)
10. **No FitnessKnowledgeDto** — For knowledge base management
11. **No VectorEmbeddingDto** — For embedding management
12. **No pagination request DTO** — No `PaginationParams` DTO (page, pageSize, sortBy, sortDirection)
13. **No filter DTOs** — No `BookingFilterDto`, `ExerciseFilterDto`, etc. for search/filter operations

### Missing for CRM
14. **No DashboardDto** — Unified dashboard response for member/coach/admin
15. **No ReportDto** — For generated reports (revenue, attendance, etc.)
16. **No ScheduleDto** — Coach/staff scheduling DTOs
17. **No BulkOperationDto** — For batch create/update/delete operations
18. **No ExportRequestDto** — For data export configuration (format, date range, columns)

---

## What Needs Updating

### P0 — Must Fix
1. **Add validation attributes to ALL input DTOs** — At minimum:
   - `[Required]` on all non-optional fields
   - `[MaxLength]` on all string fields (prevent DB overflow)
   - `[Range]` on numeric fields (TokenBalance >= 0, Rating 1-5, etc.)
   - `[EmailAddress]` on email fields
   - Example: `LoginDto.Email` should be `[Required, EmailAddress, MaxLength(255)]`
2. **Move inline DTOs to Shared/** — Move `TimeSlotDto`/`AvailableSlotDto` from IEquipmentTimeSlotService and `GeminiChatRequest`/`TestSaveRequest` from AIController
3. **Move root-level DTO files into subfolders** — `AIGenerationDTOs.cs` → `DTOs/AI/`, `WorkoutGeneratorDTOs.cs` → `DTOs/WorkoutAI/`

### P1 — Fix Before Production
4. **Add missing DTOs** — Create MemberProfileDto, CoachProfileDto, EquipmentCategoryDto, AttendanceLogDto, MilestoneDto, PaginationParams
5. **Add nullable reference type annotations** — Enable `<Nullable>enable</Nullable>` in Shared.csproj and annotate all DTOs with proper `string?` vs `string` 
6. **Separate request/response DTOs** — At minimum for entities with different read/write shapes
7. **Add `PaginationParams` base class** — Reusable `{ int Page, int PageSize, string? SortBy, string? SortDirection }` for all list endpoints
8. **Add filter DTOs** — For search/filter capabilities on key entities

### P2 — Improve
9. **Consider using records** — DTOs are perfect candidates for C# records (`record CreateBookingDto(...)`)
10. **Add XML documentation** — For Swagger API documentation
11. **Group related DTOs into multi-class files** — Small related DTOs (e.g., `UpdateUserMilestoneProgressDto` + `CompleteMilestoneDto`) could share a file
12. **Add FluentValidation** — Create validators for complex DTOs (CreateMemberDto, CompleteSetupDto) with cross-field validation rules
