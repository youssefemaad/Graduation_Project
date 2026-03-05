# Infrastructure / Presistence (Persistence) Analysis

## What Was Found

### Structure
```
Infrastructure/Presistence/
├── IntelliFitDbContext.cs           (40+ DbSets, full OnModelCreating)
├── Data/
│   └── IntelliFitDbContext.cs       (duplicate or older version?)
├── GenericRepository.cs             (ACTIVE — unconstrained, IGenericRepository<T>)
├── GenaricRepository.cs             (DEAD — constrained, IGenaricRepository<TEntity,TKey>)
├── UnitOfWork.cs                    (both typed + untyped repositories)
├── SpecificationEvaluator.cs        (DEAD — only works with typed repo)
├── EquipmentTimeSlotRepository.cs   (empty placeholder)
├── EquipmentAvailabilityRepository.cs (empty placeholder)
└── Migrations/
    ├── Scripts/                      (SQL migration scripts)
    └── [EF Migration files]
```

### IntelliFitDbContext
- **40+ DbSet<T> declarations** for all entities
- **Snake_case table naming** via `entity.ToTable("table_name")` in `OnModelCreating`
- **PostgreSQL enum mappings**: 7 enums mapped via `HasPostgresEnum<T>()`:
  - Role, BookingStatus, PaymentStatus, SubscriptionStatus, TransactionType, EquipmentStatus, NotificationType
- **Relationships configured**: FK relationships with `HasOne/HasMany`, `OnDelete(DeleteBehavior.Cascade/Restrict/SetNull/NoAction)`
- **JSON columns**: `Features` on SubscriptionPlan mapped as `jsonb` via `HasColumnType("jsonb")`
- **Indexes**: Composite and single-column indexes on key lookup fields
- **Value conversions**: Enum-to-string conversions where PostgreSQL enums aren't used
- **pgvector**: `VectorEmbedding` entity mapped with `HasPostgresExtension("vector")` and `vector(384)` column type
- **Table names**: All lowercase snake_case (e.g., `users`, `bookings`, `workout_plans`, `equipment_time_slots`)

### GenericRepository<T> (ACTIVE)
```csharp
public class GenericRepository<T> : IGenericRepository<T> where T : class
```
- Unconstrained generic — works with any entity class
- Methods: `GetByIdAsync(int)`, `GetAllAsync()`, `FindAsync(predicate)`, `FirstOrDefaultAsync(predicate)`, `CountAsync()`, `CountAsync(predicate)`, `AddAsync(T)`, `Update(T)`, `Remove(T)`
- **GetByIdAsync uses `int` parameter** — hardcoded to int primary keys
- **FindAsync** uses `Where(predicate).ToListAsync()` — actually translates to SQL (good)
- **GetAllAsync** loads entire table into memory (dangerous for large tables)

### GenaricRepository<TEntity,TKey> (DEAD)
```csharp
public class GenaricRepository<TEntity, TKey> : IGenaricRepository<TEntity, TKey> 
    where TEntity : BaseEntity<TKey>
```
- Constrained to `BaseEntity<TKey>` — **NO ENTITY inherits BaseEntity**, so this is completely unusable
- Has specification support (`GetWithSpecAsync`) — but also dead since specs are tied to BaseEntity
- Registered in DI (`AddScoped(typeof(IGenaricRepository<,>), typeof(GenaricRepository<,>))`) — dead registration

### UnitOfWork
- Implements `IUnitOfWork`
- Has TWO `Repository<>` methods:
  1. `Repository<T>()` — returns `IGenericRepository<T>` (ACTIVE, used everywhere)
  2. `Repository<TEntity, TKey>()` — returns `IGenaricRepository<TEntity,TKey>` (DEAD)
- Uses `ConcurrentDictionary` to cache repository instances
- `UntypedRepositoryAdapter` — bridges from typed `GenaricRepository` to untyped `IGenericRepository` (adapter pattern for the dead typed repo)
- `SaveChangesAsync()` delegates to DbContext
- `Dispose()` properly disposes DbContext

### SpecificationEvaluator
- **DEAD CODE** — constrained to `BaseEntity<TKey>` 
- Supports: `Criteria`, `Includes`, `OrderBy/OrderByDescending`, `Paging (Skip/Take)`
- Never called since typed repository is never used

### Empty Placeholder Files
- `EquipmentTimeSlotRepository.cs` — empty class, no implementation
- `EquipmentAvailabilityRepository.cs` — empty class, no implementation

---

## What Is Missing

### Critical
1. **No database migration strategy** — No `Database.Migrate()` in startup. Relies entirely on manual SQL scripts in `Migrations/Scripts/`
2. **No query filtering at DB level for common patterns** — `GetAllAsync()` loads full tables. Need filtered variants
3. **No eager loading support** — Active repository has no `Include()` method. Services can't request related data in single queries
4. **No AsNoTracking support** — All queries tracked by default. Read-only queries waste memory and performance
5. **No bulk operations** — No `AddRangeAsync()`, `RemoveRange()`, `UpdateRange()`

### Missing Repository Features
6. **No pagination at repository level** — `GetAllAsync()` returns everything. No `GetPagedAsync(page, pageSize)`
7. **No ordering support** — No `OrderBy()` / `OrderByDescending()` in repository
8. **No projection support** — No `Select<TResult>()` for DTO projection at DB level
9. **No raw SQL support** — No `FromSqlRaw()` / `SqlQueryRaw()` in repository
10. **No batch update/delete** — No `ExecuteUpdateAsync()` / `ExecuteDeleteAsync()` (EF Core 7+ features)

### Missing for CRM Smart Gym
11. **No audit interceptor** — No EF `SaveChangesInterceptor` to auto-log changes to AuditLog table
12. **No soft delete query filter** — No global query filter for `IsDeleted` (once soft delete is added)
13. **No multi-tenancy support** — No tenant filter for future multi-branch gym support
14. **No database seeding** — No `IDbSeeder` or `DbContext.SeedData()` method — SQL scripts are external

---

## What Needs Updating

### P0 — Must Fix
1. **Delete dead code** — Remove: `GenaricRepository.cs` (typo + dead), `SpecificationEvaluator.cs` (dead), both empty placeholder repos, and the dead `Repository<TEntity,TKey>()` method in UnitOfWork
2. **Add Include() to IGenericRepository** — Add `FindAsync(predicate, params Expression<Func<T, object>>[] includes)` overload for eager loading
3. **Add AsNoTracking** — Add `GetAllAsNoTrackingAsync()` or make ReadOnly methods use `.AsNoTracking()` by default
4. **Add Database.Migrate()** — Call in Program.cs startup or use a migration runner

### P1 — Fix Before Production
5. **Add pagination to repository** — `GetPagedAsync(predicate, page, pageSize, orderBy)` returning `(IEnumerable<T> Items, int TotalCount)`
6. **Add bulk operations** — `AddRangeAsync()`, `RemoveRange()` at minimum
7. **Fix GetByIdAsync** — Currently hardcoded to `int`. Make it accept `object` or generic `TKey` for entities with non-int PKs
8. **Rename project folder** — `Presistence` → `Persistence` (fix typo)
9. **Add SaveChanges interceptor** — For automatic audit logging, timestamps, soft delete handling

### P2 — Improve
10. **Add specification pattern (properly)** — Remove the dead BaseEntity-tied version. Implement a new `ISpecification<T>` that works with `IGenericRepository<T>`
11. **Add query projection** — `FindAsync<TResult>(predicate, selector)` for DTO projection at DB level
12. **Add connection resiliency** — Configure `EnableRetryOnFailure()` in DbContext options
13. **Review cascade delete rules** — Current mix of Cascade/Restrict/SetNull/NoAction should be documented and justified per relationship
14. **Add database health check** — `services.AddHealthChecks().AddNpgSql(connectionString)` for monitoring
