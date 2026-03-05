# Infrastructure / Presentation Layer Analysis

## What Was Found

### Structure
```
Infrastructure/Presentation/
├── Controllers/               (28 controller files)
│   ├── ApiControllerBase.cs   (base with GetUserIdFromToken helper)
│   ├── AuthController.cs
│   ├── AIController.cs
│   ├── UserController.cs
│   ├── BookingController.cs
│   ├── EquipmentController.cs
│   ├── EquipmentAvailabilityController.cs
│   ├── EquipmentTimeSlotController.cs  (DEAD — throws NotImplementedException)
│   ├── ExerciseController.cs
│   ├── WorkoutPlanController.cs
│   ├── WorkoutLogController.cs
│   ├── WorkoutTemplateController.cs
│   ├── WorkoutAIController.cs
│   ├── WorkoutGeneratorController.cs
│   ├── NutritionPlanController.cs
│   ├── MealController.cs
│   ├── SubscriptionController.cs
│   ├── PaymentController.cs
│   ├── TokenTransactionController.cs
│   ├── NotificationController.cs
│   ├── ChatController.cs
│   ├── CoachReviewController.cs
│   ├── InBodyController.cs
│   ├── StatsController.cs
│   ├── ReceptionController.cs
│   ├── AuditLogController.cs
│   ├── ActivityFeedController.cs
│   └── UserMilestoneController.cs
└── Hubs/
    ├── ChatHub.cs
    └── NotificationHub.cs
```

### Controller Patterns

**Base Controller:**
- `ApiControllerBase` provides `GetUserIdFromToken()` helper extracting `ClaimTypes.NameIdentifier` from JWT

**DI Patterns (INCONSISTENT):**
| Pattern | Controllers |
|---|---|
| `IServiceManager` only (correct) | Auth, Booking, Equipment, EquipmentAvailability, Exercise, WorkoutPlan, WorkoutLog, WorkoutTemplate, NutritionPlan, Meal, Subscription, Payment, TokenTransaction, Notification, CoachReview, InBody, Stats, Reception, AuditLog, ActivityFeed, UserMilestone |
| Direct service injection (bypasses ServiceManager) | ChatController (IChatService), WorkoutGeneratorController (IWorkoutGeneratorService), WorkoutAIController (IWorkoutAIService + IWorkoutFeedbackService) |
| Multiple injections | AIController (IServiceManager + IConfiguration + IMemoryCache), UserController (IServiceManager + IWebHostEnvironment) |

**Authentication:**
| Level | Controllers |
|---|---|
| `[Authorize]` on class | Most controllers |
| `[Authorize(Roles = "Admin")]` | AuditLogController |
| `[Authorize(Roles = "Coach")]` | Some WorkoutTemplate endpoints (Create/Update/Delete) |
| **NO `[Authorize]`** | **AIController** (temporarily disabled — security risk!) |

**Response Patterns (INCONSISTENT):**
| Pattern | Example |
|---|---|
| `ApiResponse<T>` wrapper | AuthController, some AIController endpoints |
| Raw `Ok(data)` | Most controllers — StatsController, MealController, InBodyController, etc. |
| Anonymous objects | ReceptionController (`new { message = "..." }`), UserController |

### Key Controllers Deep Dive

**AIController (most complex):**
- 10+ endpoints for chat, plan generation, session management
- `/chat` — Legacy Groq-based AI chat (no token cost)
- `/generate-workout-plan` — 50 tokens per generation
- `/generate-nutrition-plan` — 50 tokens per generation
- `/gemini-chat` — Groq-based (misnamed), 1 token per message
- `/sessions` management, test endpoints
- **Contains inline DTOs**: `GeminiChatRequest`, `TestSaveRequest` (should be in Shared)
- **`[Authorize]` IS DISABLED** — all endpoints are public

**BookingController:**
- Full CRUD + availability + coach session booking
- Most well-structured controller
- Uses `ApiResponse<T>` inconsistently

**ReceptionController:**
- CRM-oriented: member check-in/out, QR code, search, create member
- Live activities feed, alerts, reception stats
- Primary constructor pattern (good)

**WorkoutAIController:**
- Injects services directly (not via ServiceManager)
- Generates plans via ML model, saves to DB
- Strength profile, muscle scan analysis
- User plan management (my-plans, delete)

### SignalR Hubs

**ChatHub:**
- `[Authorize]` — JWT auth required
- `ConcurrentDictionary<int, string>` for user-to-connection mapping
- Message deduplication via `_processedMessages` (HashSet with 10-minute window)
- Methods: GetChatHistory, SendMessageToCoach, SendMessageToMember, MarkAsRead, UserTyping/StoppedTyping
- `SendAIMessage` — **STUB** (sends empty AI response, never actually calls AI)
- Group-based messaging with echo prevention (sender excluded)

**NotificationHub:**
- `[Authorize]` — JWT auth required
- On connect: joins `role_{role}` and `user_{userId}` groups
- Methods: SendNotificationToAll, MarkAsRead
- Clean implementation

### Dead Controllers
- **EquipmentTimeSlotController.cs** — ALL endpoints throw `NotImplementedException`

---

## What Is Missing

### Critical
1. **No input validation** — No `[Required]`, `[MaxLength]`, `[Range]` annotations on any DTO used in controller actions. No FluentValidation. ModelState.IsValid only checked in 2 controllers (InBody, Meal)
2. **No global exception handling** — Each controller has ad-hoc try/catch. Some endpoints (StatsController) let exceptions bubble up unhandled
3. **No consistent response format** — Mix of `ApiResponse<T>`, raw objects, and anonymous objects
4. **No pagination** — All list endpoints return unbounded results (GetAllMeals, GetAllExercises, GetUserNotifications, etc.)

### Missing Controllers for CRM
5. **No MemberProfileController** — MemberProfile entity exists but no dedicated CRUD endpoints
6. **No CoachProfileController** — CoachProfile CRUD is embedded in UserController partially
7. **No IngredientController** — MealIngredient has no API endpoints
8. **No AchievementController** — Milestone entity exists but no achievement/gamification endpoints
9. **No ReportController** — No admin reporting/export endpoints
10. **No ScheduleController** — No coach/staff schedule management endpoints
11. **No DashboardController** — No unified dashboard API for member/coach/admin views
12. **No GymSettingsController** — No gym configuration endpoints

### Missing API Features
13. **No file upload for InBody** — InBody measurements are manual input; could support scan upload
14. **No batch operations** — No bulk create/update/delete endpoints
15. **No search/filter on most endpoints** — Only ReceptionController has search
16. **No sorting parameters** — Hardcoded ordering in all endpoints
17. **No ETag/caching headers** — No HTTP caching support on any endpoint

---

## What Needs Updating

### P0 — Must Fix
1. **Re-enable `[Authorize]` on AIController** — Currently ALL AI endpoints are public. This is a critical security vulnerability
2. **Delete EquipmentTimeSlotController** — It throws NotImplementedException on every endpoint. Functionality exists in EquipmentAvailabilityController
3. **Fix inconsistent DI pattern** — ChatController, WorkoutGeneratorController, WorkoutAIController should use IServiceManager like all other controllers (requires exposing those services via IServiceManager)
4. **Remove inline DTOs from AIController** — Move `GeminiChatRequest`, `TestSaveRequest` to Shared/DTOs/AI/

### P1 — Fix Before Production
5. **Add global exception handling middleware** — Replace all ad-hoc try/catch with middleware returning consistent `ApiResponse<T>` with proper HTTP status codes
6. **Standardize response format** — All endpoints return `ApiResponse<T>` or `PaginatedResponse<T>` — no raw objects or anonymous types
7. **Add input validation** — Either FluentValidation or DataAnnotations on all DTOs + `[ApiController]` ModelState auto-validation
8. **Add pagination** — All list endpoints should accept `page` and `pageSize` query parameters and return `PaginatedResponse<T>`
9. **Fix ChatHub.SendAIMessage** — Either implement it properly or remove the stub
10. **Add role-based authorization per endpoint** — Review which endpoints should be restricted to specific roles:
    - Admin: AuditLog (done), user management, gym settings
    - Coach: WorkoutTemplate write (partially done), workout plan assignment
    - Receptionist: ReceptionController (done, but no role restriction!)
    - Member: Own data only

### P2 — Improve
11. **Add API documentation** — XML comments on all controller actions for Swagger
12. **Add action filters** — For common concerns (logging, audit trails, performance monitoring)
13. **Add `[ProducesResponseType]`** — Document response types for Swagger
14. **Consider minimal APIs** — For simple CRUD endpoints that just delegate to ServiceManager
15. **Add SignalR Hub authentication improvements** — ChatHub should verify user permissions before allowing operations (e.g., can this user message that other user?)
