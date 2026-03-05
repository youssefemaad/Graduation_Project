# Core / Service Layer Analysis

## What Was Found

### Structure
```
Core/Service/
├── ServiceManager.cs              (Lazy<T> pattern, 24 services)
├── Services/                      (31 service implementation files)
│   ├── AuthService.cs
│   ├── TokenService.cs
│   ├── UserService.cs
│   ├── BookingService.cs
│   ├── EquipmentService.cs
│   ├── EquipmentTimeSlotService.cs
│   ├── ExerciseService.cs
│   ├── WorkoutPlanService.cs
│   ├── WorkoutLogService.cs
│   ├── WorkoutTemplateService.cs
│   ├── NutritionPlanService.cs
│   ├── MealService.cs
│   ├── SubscriptionService.cs
│   ├── PaymentService.cs
│   ├── TokenTransactionService.cs
│   ├── NotificationService.cs
│   ├── ChatService.cs
│   ├── CoachReviewService.cs
│   ├── InBodyService.cs
│   ├── StatsService.cs
│   ├── ReceptionService.cs
│   ├── AuditLogService.cs
│   ├── ActivityFeedService.cs
│   ├── UserMilestoneService.cs
│   ├── AIService.cs
│   ├── MLServiceClient.cs
│   ├── WorkoutAIService.cs
│   ├── WorkoutFeedbackService.cs
│   └── WorkoutGeneratorService.cs
├── BackgroundServices/
│   └── BookingCleanupService.cs
├── MappingProfiles/
│   └── MappingProfile.cs
└── Specifications/
    └── BaseSpecification.cs       (dead code — tied to BaseEntity)
```

### ServiceManager.cs
- **Lazy<T> pattern** for all 24 services — services are created on first access
- Constructor takes: `IServiceProvider`, `IConfiguration`, `IMemoryCache`, `IUnitOfWork`, `IMapper`, `ILoggerFactory`
- `BookingService` has special factory pattern (wraps in Func<>)
- **`_lazyEquipmentTimeSlotService` created internally but NOT exposed** — confirmed gap
- All Lazy<T> initialization resolves dependencies from `IServiceProvider`

### Key Service Implementations

**AuthService:**
- BCrypt password hashing (`BCrypt.Net.BCrypt.EnhancedHashPassword`)
- Login returns `AuthResponseDto` with JWT, user info, profileCompleted flag
- Register validates unique email
- CreateUserWithRole for admin-created accounts
- CompleteSetup creates MemberProfile/CoachProfile based on role

**BookingService:**
- Most complex service — handles equipment bookings, coach sessions, parent-child booking relationships
- Token deduction on booking creation
- Token refund on cancellation (only if not auto-booked for coach session)
- Availability checking against EquipmentTimeSlots
- CheckIn/CheckOut tracking
- Uses `IEquipmentTimeSlotService` internally

**ChatService:**
- `IDistributedCache` for caching chat history, unread counts, conversations
- Cache invalidation on new messages/reads
- Message expiration (1 month default) with permanent flag
- `ConversationId` generated from sorted user IDs

**NotificationService:**
- Dual: DB persistence + SignalR real-time delivery
- `IHubContext<NotificationHub>` for group-based messaging
- Category-specific notifications (booking confirmed, payment, workout assigned, equipment status)

**MLServiceClient:**
- HttpClient to Python FastAPI at port 5300/5301
- 300-second timeout (CPU ML model inference)
- Calls `/generate-direct` for workout generation, `/health` for health check

**WorkoutGeneratorService:**
- HttpClient to Python FastAPI at port 8000
- Builds text prompt from `GenerateWorkoutRequest`
- Simpler than MLServiceClient — just prompt formatting + HTTP call

**BookingCleanupService (Background):**
- Runs daily at midnight (UTC)
- Generates equipment time slots 7 days ahead
- Marks expired bookings as completed (if checked in) or cancelled (no-show)
- Refunds tokens for no-shows (non-auto-booked only)
- Clears expired time slots

**MappingProfile (AutoMapper):**
- Maps: WorkoutLog, CoachReview, Notification, TokenTransaction, ActivityFeed, UserMilestone, WorkoutTemplate, AuditLog, Booking, Payment
- Notable patterns: enum → string conversions, `ForAllMembers` with null conditions for updates, manual UserName setting (Ignored in map, set manually in service)

**BaseSpecification:**
- **DEAD CODE** — Constrained to `BaseEntity<TKey>` which no entity inherits
- Supports: Criteria, Includes, Paging
- Never used by any service

---

## What Is Missing

### Critical
1. **No transaction management in services** — Services call `SaveChangesAsync()` but never wrap multi-step operations in explicit transactions. Example: BookingService deducts tokens and creates booking — if booking fails after token deduction, tokens are lost
2. **No input validation in services** — Services trust all incoming data. No null checks, range validation, or business rule validation before DB operations
3. **No authorization checks in services** — Controllers check `[Authorize]` but services never verify if the calling user has permission to modify the requested resource (e.g., any user could update another user's milestone)

### Missing Service Implementations
4. **No IngredientService** — MealIngredient entity exists but no CRUD service
5. **No mapping for many entities** — MappingProfile only covers 10 entity types out of 40+. Services like UserService, SubscriptionService, InBodyService manually construct DTOs inline

### Performance Issues
6. **N+1 queries everywhere** — Services use `GetAllAsync()` then LINQ `.Where()` in memory instead of DB-level filtering. Example: `NotificationService.GetUserNotificationsAsync()` loads ALL notifications, then filters by userId
7. **No Include() usage** — Services load related data separately (e.g., load booking, then separately load user, then separately load equipment) instead of using EF Include()
8. **No projection** — Services load full entities then manually map to DTOs. Should use `.Select()` for DB-level projection

### Missing for CRM
9. **No audit logging integration** — `AuditLogService` exists but no service automatically creates audit logs. Should be automatic via interceptor or middleware
10. **No activity feed integration** — `ActivityFeedService` exists but no service automatically creates activities
11. **No token transaction logging** — Token operations in BookingService don't create TokenTransaction records

---

## What Needs Updating

### P0 — Must Fix
1. **Add explicit transactions** — Wrap multi-step operations in `BeginTransactionAsync()`/`CommitAsync()` (e.g., BookingService.CreateBookingAsync, PaymentService.CreatePaymentAsync)
2. **Expose IEquipmentTimeSlotService via ServiceManager** — Add the property and backing Lazy<T>
3. **Fix N+1 queries** — Replace `GetAllAsync()` + `.Where()` with `FindAsync(predicate)` in: NotificationService, and ensure FindAsync translates to SQL WHERE clause. Also use `CountAsync(predicate)` instead of loading all then counting

### P1 — Fix Before Production
4. **Add resource ownership validation** — Services should verify that the calling user is authorized to modify the requested resource
5. **Complete AutoMapper profile** — Add mappings for all entity → DTO conversions. Current coverage: 10/40+ entities
6. **Add Include() for related data** — Use `.Include()` in repository queries instead of separate lookups for related entities
7. **Remove BaseSpecification** — It's dead code (tied to BaseEntity). Either delete it or implement a working specification pattern

### P2 — Improve
8. **Add DB-level projection** — Use `.Select()` to project to DTOs at the database level instead of loading full entities
9. **Add automatic audit logging** — Use EF SaveChanges interceptor to auto-create AuditLog entries
10. **Add automatic activity feed** — Use domain events or interceptors to auto-create ActivityFeed entries
11. **Consolidate AI services** — AIService, WorkoutAIService, WorkoutFeedbackService, WorkoutGeneratorService, MLServiceClient overlap significantly. Consider clear boundaries:
    - `IAIService` → Chat/conversation management (Groq/Gemini)
    - `IWorkoutAIService` → ML-based workout generation (combines current WorkoutAI + MLClient + WorkoutGenerator)
    - Remove `IWorkoutFeedbackService` → merge into IWorkoutAIService
12. **Add retry/circuit breaker** — MLServiceClient and WorkoutGeneratorService make HTTP calls to external processes with no retry or circuit breaker patterns. Use Polly
