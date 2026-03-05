using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using DomainLayer.Contracts;
using DomainLayer.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;


namespace IntelliFit.Infrastructure.Persistence.Repository
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly IntelliFitDbContext _dbContext;
        private readonly Dictionary<string, object> _repositories = new();

        public UnitOfWork(IntelliFitDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public IGenaricRepository<TEntity, TKey> GetRepository<TEntity, TKey>() where TEntity : BaseEntity<TKey>
        {
            var typeName = typeof(TEntity).Name;
            if (_repositories.TryGetValue(typeName, out var repo))
                return (IGenaricRepository<TEntity, TKey>)repo;

            var repositoryType = typeof(GenericRepository<,>).MakeGenericType(typeof(TEntity), typeof(TKey));
            var repoInstance = Activator.CreateInstance(repositoryType, _dbContext)!;
            _repositories[typeName] = repoInstance;
            return (IGenaricRepository<TEntity, TKey>)repoInstance;
        }

        public Task<int> SaveChangesAsync() => _dbContext.SaveChangesAsync();

        // Backwards-compatible untyped repository implementation
        public IGenericRepository<T> Repository<T>() where T : class
        {
            var typeName = typeof(T).Name + "_untyped";
            if (_repositories.TryGetValue(typeName, out var repo))
                return (IGenericRepository<T>)repo;

            var adapter = new UntypedRepositoryAdapter<T>(_dbContext);
            _repositories[typeName] = adapter;
            return adapter;
        }

        // Transaction helpers - returns the transaction object for proper disposal
        // Cast to IDisposable to keep domain layer clean from EF Core dependencies
        public async Task<IDisposable> BeginTransactionAsync()
        {
            return await _dbContext.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_dbContext.Database.CurrentTransaction != null)
            {
                await _dbContext.Database.CommitTransactionAsync();
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_dbContext.Database.CurrentTransaction != null)
            {
                await _dbContext.Database.RollbackTransactionAsync();
            }
        }

        public void Dispose()
        {
            _dbContext?.Dispose();
        }

        // Simple adapter implementing IGenericRepository<T> using DbContext directly
        private class UntypedRepositoryAdapter<T> : IGenericRepository<T> where T : class
        {
            private readonly IntelliFitDbContext _context;
            private readonly DbSet<T> _set;

            public UntypedRepositoryAdapter(IntelliFitDbContext context)
            {
                _context = context;
                _set = _context.Set<T>();
            }

            public async Task<T?> GetByIdAsync(int id) => await _set.FindAsync(id);

            public async Task<IEnumerable<T>> GetAllAsync() => await _set.ToListAsync();

            public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
                => await _set.Where(predicate).ToListAsync();

            public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
                => await _set.FirstOrDefaultAsync(predicate);

            public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
                => await _set.AnyAsync(predicate);

            public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
                => predicate == null ? await _set.CountAsync() : await _set.CountAsync(predicate);

            public async Task<T> AddAsync(T entity)
            {
                await _set.AddAsync(entity);
                return entity;
            }

            public async Task AddRangeAsync(IEnumerable<T> entities)
            {
                await _set.AddRangeAsync(entities);
            }

            public void Update(T entity) => _set.Update(entity);

            public void Remove(T entity) => _set.Remove(entity);

            public void RemoveRange(IEnumerable<T> entities) => _set.RemoveRange(entities);
        }
    }
}