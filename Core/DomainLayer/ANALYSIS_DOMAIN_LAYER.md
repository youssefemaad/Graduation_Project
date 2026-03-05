# Core / DomainLayer Analysis

## What Was Found

### Overall Structure
```
Core/DomainLayer/
├── Models/         (40+ entity files)
│   └── AI/         (7 AI-specific entities)
├── Contracts/      (7 interface files, 3 are empty placeholders)
├── Enums/          (19 enum files)
├── BaseEntity.cs   (generic base with Id property)
└── AuditableEntity.cs (adds CreatedAt/UpdatedAt/CreatedBy/UpdatedBy)
```

### Entity Models (40+ files)
All entities use namespace `IntelliFit.Domain.Models` and contain:

| Core Entities | Purpose |
|---|---|
| `User` | Central entity — UserId, Name, Email, PasswordHash, Role (enum), TokenBalance, QRCode, IsActive, MemberProfile/CoachProfile nav |
| `MemberProfile` | Height, Weight, FitnessLevel, Goals, MedicalConditions, EmergencyContact |
| `CoachProfile` | Specialization, Experience, Bio, Certifications, HourlyRate, MaxClients, Rating |
| `Booking` | UserId, EquipmentId?, CoachId?, StartTime/EndTime, Status (enum), TokensCost, CheckInTime, ParentBookingId, IsAutoBookedForCoachSession |
| `Equipment` | Name, EquipmentCategoryId, Status (enum), Location, MaxCapacity, IsActive |
| `EquipmentCategory` | CategoryName, Description |
| `EquipmentTimeSlot` | EquipmentId, Date, StartTime/EndTime, CurrentBookings, MaxCapacity, IsAvailable |
| `SubscriptionPlan` | Name, Price, DurationMonths, TokensIncluded, Features (JSON), MaxFreeze, IsActive |
| `Subscription` | UserId, PlanId, StartDate/EndDate, Status, FreezeCount, PaymentId |
| `Payment` | UserId, Amount, PaymentMethod, Status (enum), TransactionReference, SubscriptionPlanId |
| `TokenTransaction` | UserId, Amount, TransactionType (enum), Description, RelatedBookingId |

| Workout/Nutrition | Purpose |
|---|---|
| `WorkoutPlan` | MemberId, CoachId?, PlanName, Description, DifficultyLevel, StartDate/EndDate, IsActive, ProgressPercentage, PlanType, GeneratedByAi |
| `WorkoutPlanDay` | PlanId, DayNumber, DayName, FocusArea |
| `WorkoutPlanExercise` | DayId, ExerciseId, Sets/Reps/RestSeconds, Notes, OrderIndex |
| `Exercise` | Name, Description, MuscleGroup, DifficultyLevel, EquipmentNeeded, VideoUrl, ImageUrl, IsActive, mechanic_type, exercise_type |
| `WorkoutTemplate` | CreatedByCoachId, TemplateName, Description, DifficultyLevel, IsPublic |
| `WorkoutTemplateExercise` | TemplateId, ExerciseId, Sets/Reps/RestSeconds, Notes |
| `WorkoutLog` | UserId, PlanId?, Date, DurationMinutes, CaloriesBurned, Notes, ExercisesCompleted (deprecated JSON) |
| `NutritionPlan` | MemberId, PlanName, DailyCalories, Protein/Carbs/Fat goals, MealsPerDay, IsActive, GeneratedByAi |
| `Meal` | Name, Description, Calories, Protein/Carbs/Fat, MealType, IsActive, ImageUrl |
| `MealIngredient` | MealId, Name, Quantity, Unit, Calories/Protein/Carbs/Fat |

| Social/Admin | Purpose |
|---|---|
| `ChatMessage` | SenderId, ReceiverId, Message, ConversationId, IsRead, ReadAt, ExpiresAt, IsPermanent |
| `Notification` | UserId, Title, Message, NotificationType (enum), IsRead, ReadAt |
| `CoachReview` | UserId, CoachId, Rating, Comment |
| `InBodyMeasurement` | UserId, Weight, MuscleMass, BodyFatPercentage, BMI, VisceralFat, MetabolicAge, BodyWaterPercentage, BasalMetabolicRate, SkeletalMuscleMass |
| `AttendanceLog` | UserId, CheckInTime, CheckOutTime, Duration |
| `ActivityFeed` | UserId, ActivityType, Description, RelatedEntityId/Type |
| `Milestone` | Name, Description, Category, TargetValue, RewardTokens, Icon |
| `UserMilestone` | UserId, MilestoneId, CurrentValue, TargetValue, IsCompleted, CompletedAt |
| `AuditLog` | UserId?, Action, TableName, RecordId?, OldValues/NewValues (JSON), IpAddress |

| AI Models (Models/AI/) | Purpose |
|---|---|
| `UserFeatureSnapshot` | Point-in-time capture of user features for ML |
| `AiModelVersion` | ModelName, Version, Accuracy, IsActive |
| `AiInferenceLog` | Tracks AI model inference calls |
| `VectorEmbedding` | pgvector support — EntityType/EntityId, Embedding (float[]), EmbeddingModel |
| `FitnessKnowledge` | Category, Title, Content, Source — knowledge base for RAG |
| `UserAIWorkoutPlan` | UserId, PlanData (JSON), Feedback, Rating |
| `UserAIWorkoutDay` / `UserAIWorkoutExercise` | Structured AI-generated workout plan storage |

### Contracts (7 files)
| File | Status |
|---|---|
| `IGenericRepository<T>` | **ACTIVE** — Unconstrained, used throughout project. Methods: GetByIdAsync, GetAllAsync, FindAsync, FirstOrDefaultAsync, CountAsync, AddAsync, Update, Remove |
| `IGenaricRepository<TEntity,TKey>` | **DEAD CODE** — Constrained to `BaseEntity<TKey>`. No entity inherits BaseEntity, so this is unusable |
| `ISpecification<TEntity,TKey>` | **DEAD CODE** — Also constrained to BaseEntity<TKey> |
| `IUnitOfWork` | **ACTIVE** — Exposes both `Repository<T>()` (untyped) and `Repository<TEntity,TKey>()` (typed, dead) |
| 3 empty files | **PLACEHOLDERS** — Empty class files that were never implemented |

### Enums (19 files)
| Enum | Values |
|---|---|
| `Role` | Member, Coach, Receptionist, Admin |
| `BookingStatus` | Pending, Confirmed, Cancelled, Completed, CheckedIn, NoShow |
| `EquipmentStatus` | Available, InUse, Maintenance, OutOfOrder |
| `PaymentStatus` | Pending, Completed, Failed, Refunded |
| `SubscriptionStatus` | Active, Expired, Frozen, Cancelled |
| `TransactionType` | Purchase, Usage, Refund, Reward, AdminGrant |
| `NotificationType` | Info, Success, Warning, Error, Booking, Payment, Workout, Achievement |
| `FitnessEnums.cs` | **MEGA FILE** containing FitnessLevel, FitnessGoal, MuscleGroup, DifficultyLevel, DayOfWeek, MealType + duplicates of standalone enums |
| Individual files | FitnessLevel, FitnessGoal, MuscleGroup, DifficultyLevel — **DUPLICATED** inside FitnessEnums.cs |

### Base Classes
- `BaseEntity<TKey>` — namespace `DomainLayer.Models` (DIFFERENT from entities using `IntelliFit.Domain.Models`)
- `AuditableEntity` — Inherits `BaseEntity<int>`, adds CreatedAt/UpdatedAt/CreatedBy/UpdatedBy. **NO ENTITY INHERITS THIS.**

---

## What Is Missing

### Critical
1. **No entity inherits BaseEntity or AuditableEntity** — These base classes are completely disconnected from all entities
2. **No navigation properties on many entities** — Many entities lack nav props for related data (e.g., `Booking.User`, `Booking.Equipment` are defined but not consistently)
3. **No data annotations for validation** — Entities have no `[Required]`, `[MaxLength]`, `[Range]` etc. All validation depends on DB constraints
4. **No soft delete pattern** — No `IsDeleted` flag on any entity; hard deletes only
5. **No concurrency control** — No `[ConcurrencyCheck]` or `RowVersion` on any entity

### Missing for CRM Smart Gym
6. **No `FreezeHistory` entity** — Subscription has `FreezeCount` but no record of freeze periods
7. **No `PromotionCode` / `Discount` entity** — No promo/coupon system
8. **No `GymBranch` entity** — Single-branch assumption; no multi-location support
9. **No `StaffSchedule` entity** — No coach/receptionist shift management  
10. **No `MembershipTransfer` entity** — No mechanism to transfer memberships
11. **No `ExpenseTracking` entity** — No financial expense/revenue tracking for admin
12. **No `EquipmentMaintenance` entity** — Equipment has status but no maintenance log
13. **No `ClassSchedule` / `GroupSession` entity** — No group fitness class support
14. **No `WaitList` entity** — No waitlist for full bookings
15. **No `MemberGoalTracking` entity** — Member goals are a string field, not trackable entities

---

## What Needs Updating

### P0 — Must Fix
1. **Unify namespaces** — BaseEntity uses `DomainLayer.Models`, entities use `IntelliFit.Domain.Models`. Pick ONE namespace
2. **Remove dead code** — Delete `BaseEntity<TKey>`, `AuditableEntity`, `IGenaricRepository<TEntity,TKey>`, `ISpecification<TEntity,TKey>`, and the 3 empty contract files. OR: Make entities inherit them (but this requires significant refactoring + migration)
3. **Fix DateTime.UtcNow in property initializers** — `CreatedAt = DateTime.UtcNow` in property declarations is an EF anti-pattern. Move to EF `HasDefaultValueSql("NOW()")` or set in service layer
4. **Deduplicate enums** — Remove duplicates from `FitnessEnums.cs` or remove individual enum files. Keep one source of truth

### P1 — Fix Before Production
5. **Add data annotations** — At minimum: `[Required]` on non-nullable fields, `[MaxLength]` on strings, `[Range]` on numeric fields
6. **Add navigation properties consistently** — Ensure all FK relationships have proper nav props for EF Include() support
7. **Add `IsDeleted` + soft delete** — Especially for User, Equipment, Subscription, WorkoutPlan
8. **Fix ChatMessage.GenerateConversationId** — Remove static method from entity; should be in service layer
9. **Remove deprecated `ExercisesCompleted`** — WorkoutLog.ExercisesCompleted is marked deprecated but still present

### P2 — Improve
10. **Add domain value objects** — Extract concepts like `DateRange`, `TokenAmount`, `Rating` as value objects
11. **Add domain events** — Raise events on booking creation, payment, subscription changes
12. **Seal entity classes** — Mark entities as `sealed` to prevent unintended inheritance
13. **Consider using records for immutable entities** — `Milestone`, `EquipmentCategory` could be records
