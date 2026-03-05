# Core / ServiceAbstraction Analysis

## What Was Found

### Structure
```
Core/ServiceAbstraction/
├── IServiceManager.cs          (exposes 24 services)
├── Services/                   (27 service interfaces)
│   ├── IAuthService.cs
│   ├── ITokenService.cs
│   ├── IUserService.cs
│   ├── IBookingService.cs
│   ├── IEquipmentService.cs
│   ├── IEquipmentTimeSlotService.cs
│   ├── IExerciseService.cs
│   ├── IWorkoutPlanService.cs
│   ├── IWorkoutLogService.cs
│   ├── IWorkoutTemplateService.cs
│   ├── INutritionPlanService.cs
│   ├── IMealService.cs
│   ├── ISubscriptionService.cs
│   ├── IPaymentService.cs
│   ├── ITokenTransactionService.cs
│   ├── INotificationService.cs
│   ├── IChatService.cs
│   ├── ICoachReviewService.cs
│   ├── IInBodyService.cs
│   ├── IStatsService.cs
│   ├── IReceptionService.cs
│   ├── IAuditLogService.cs
│   ├── IActivityFeedService.cs
│   ├── IUserMilestoneService.cs
│   ├── IAIService.cs
│   ├── IMLServiceClient.cs
│   ├── IWorkoutAIService.cs
│   ├── IWorkoutFeedbackService.cs
│   └── IWorkoutGeneratorService.cs
```

### IServiceManager — Gateway Pattern
Exposes 24 services via lazy-loaded properties:
```
IAuthService, ITokenService, IUserService, IBookingService, 
IEquipmentService, IExerciseService, IWorkoutPlanService, 
IWorkoutLogService, IWorkoutTemplateService, INutritionPlanService, 
IMealService, ISubscriptionService, IPaymentService, 
ITokenTransactionService, INotificationService, ICoachReviewService, 
IInBodyService, IStatsService, IReceptionService, IAuditLogService, 
IActivityFeedService, IUserMilestoneService, IAIService, IChatService
```

### Service Interface Categories

**Authentication & Users:**
- `IAuthService` — Register, Login, CreateUserWithRole, ChangePassword, CompleteSetup, CheckEmail
- `ITokenService` — GenerateToken(User), ValidateToken (JWT creation/validation)
- `IUserService` — CRUD, GetCoaches, UpdateProfile, Deactivate, Metrics, WorkoutSummary, AIContext, UploadProfileImage

**Booking & Equipment:**
- `IBookingService` — Create/Cancel booking, GetByUser, Availability checks, CoachSessionEquipment, CheckIn/Out  
- `IEquipmentService` — CRUD, GetAvailable, UpdateStatus
- `IEquipmentTimeSlotService` — GenerateDailySlots, GetAvailableSlots, BookSlot, ReleaseSlot, ClearExpiredSlots. **Contains inline DTO definitions** (TimeSlotDto, AvailableSlotDto)

**Workout & Nutrition:**
- `IWorkoutPlanService` — Templates, MemberPlans, Assign, UpdateProgress, Complete
- `IWorkoutLogService` — CRUD for workout logs
- `IWorkoutTemplateService` — Coach template CRUD, public templates
- `INutritionPlanService` — Generate, CRUD for member plans
- `IMealService` — CRUD for meals
- `IExerciseService` — GetAll, ByMuscleGroup, ByDifficulty, Active

**Subscriptions & Payments:**
- `ISubscriptionService` — Plan CRUD, CreateSubscription, CheckActive
- `IPaymentService` — Create, GetByUser, UpdateStatus
- `ITokenTransactionService` — Create, GetUserTransactions, GetBalance

**Communication:**
- `INotificationService` — CRUD + SignalR (SendToUser/Role/All, specific notifications for booking/payment/workout)
- `IChatService` — SaveMessage, GetHistory, MarkRead, GetConversations, UnreadCount, CleanupExpired, MarkPermanent

**Admin & CRM:**
- `IReceptionService` — CheckIn/Out, QRCode, SearchMembers, CreateMember, LiveActivities, Alerts
- `IStatsService` — MemberStats, CoachStats, ReceptionStats
- `IAuditLogService` — Create, GetByUser, GetByTable
- `IActivityFeedService` — Create, GetByUser, GetRecent
- `IUserMilestoneService` — Get, UpdateProgress, Complete
- `ICoachReviewService` — CRUD, AverageRating

**AI / ML:**
- `IAIService` — GenerateWorkoutPlan, GenerateNutritionPlan, ChatWithAI, GeminiChat, Sessions, TestSave
- `IMLServiceClient` — GenerateWorkoutPlanAsync(MLWorkoutRequest), CheckHealthAsync
- `IWorkoutAIService` — GenerateWorkoutPlan, SavePlan, GetMyPlans, DeletePlan, GetCoachFeedback
- `IWorkoutFeedbackService` — SubmitFeedback, GetFeedback, GetStrengthProfile, MergeMuscleScans
- `IWorkoutGeneratorService` — GenerateWorkout(GenerateWorkoutRequest)

---

## What Is Missing

### Critical
1. **IEquipmentTimeSlotService NOT exposed via IServiceManager** — The interface exists, the service is registered in DI, but IServiceManager doesn't have a property for it. BookingCleanupService resolves it directly; EquipmentAvailabilityController uses BookingService as workaround
2. **No IIngredientService** — MealIngredient entity exists but no service interface for managing ingredients separately
3. **No error contracts** — No custom exception types (e.g., `NotFoundException`, `BusinessRuleException`, `UnauthorizedException`). Services throw raw `KeyNotFoundException` or `InvalidOperationException`

### Missing for CRM Smart Gym
4. **No IReportService** — No reporting/analytics service for admin dashboards (revenue, attendance trends, equipment usage)
5. **No IEmailService** — No email notification service
6. **No IScheduleService** — No coach/staff scheduling service
7. **No IDiscountService** — No promotional discounts/coupon management
8. **No IExportService** — No data export (PDF reports, CSV exports)
9. **No IMaintenanceService** — No equipment maintenance tracking service
10. **No IGymConfigService** — No gym settings/configuration management
11. **No IWaitListService** — No waitlist management for full bookings/sessions
12. **No IDashboardService** — No unified dashboard data aggregation service

### Design Issues Found
13. **Inline DTOs in IEquipmentTimeSlotService** — `TimeSlotDto` and `AvailableSlotDto` defined inside the interface file instead of in Shared/DTOs
14. **Inconsistent service naming** — Some use "Service" suffix consistently, but AI services have `IMLServiceClient` (not a "service"), `IWorkoutGeneratorService` vs `IWorkoutAIService` (overlapping responsibilities)
15. **No cancellation token support** — None of the interfaces accept `CancellationToken` parameters

---

## What Needs Updating

### P0 — Must Fix
1. **Expose IEquipmentTimeSlotService in IServiceManager** — Add property and implement in ServiceManager
2. **Move inline DTOs out of IEquipmentTimeSlotService** — Move `TimeSlotDto`, `AvailableSlotDto` to `Shared/DTOs/Equipment/`

### P1 — Fix Before Production
3. **Add custom exception types** — Create `NotFoundException`, `BusinessRuleException`, `ConflictException`, `ForbiddenException` in DomainLayer
4. **Add CancellationToken to all async methods** — All interface methods should accept `CancellationToken cancellationToken = default`
5. **Consolidate AI service interfaces** — `IAIService`, `IWorkoutAIService`, `IWorkoutFeedbackService`, `IWorkoutGeneratorService`, `IMLServiceClient` have overlapping responsibilities. Consider merging into fewer, clearer boundaries
6. **Add pagination parameters to list methods** — Most `GetAll*` methods return unbounded lists. Add `(int page, int pageSize)` parameters

### P2 — Improve
7. **Add service result pattern** — Return `ServiceResult<T>` (or `Result<T>`) instead of throwing exceptions for business logic failures
8. **Add `IIngredientService`** — For separate ingredient management
9. **Add missing CRM services** — `IReportService`, `IScheduleService`, `IExportService` as prioritized by business needs
10. **Consider CQRS-lite** — Split read-heavy services (Stats, Reports) from write-heavy services (Booking, Payment) for better separation
