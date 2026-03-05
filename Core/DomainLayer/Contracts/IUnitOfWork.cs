using System;
using System.Threading.Tasks;
using DomainLayer.Models;

namespace DomainLayer.Contracts
{
    public interface IUnitOfWork : IDisposable
    {
        // Backwards-compatible untyped repository access
        IGenericRepository<T> Repository<T>() where T : class;

        // Typed repository access (new)
        IGenaricRepository<TEntity, TKey> GetRepository<TEntity, TKey>() where TEntity : BaseEntity<TKey>;

        // Transaction management
        Task<int> SaveChangesAsync();

        /// <summary>
        /// Begins a database transaction and returns a disposable transaction object.
        /// The caller must dispose the transaction (commit or rollback).
        /// </summary>
        Task<IDisposable> BeginTransactionAsync();

        /// <summary>
        /// Commits the current database transaction (legacy - prefer using the transaction object)
        /// </summary>
        Task CommitTransactionAsync();

        /// <summary>
        /// Rolls back the current database transaction (legacy - prefer using the transaction object)
        /// </summary>
        Task RollbackTransactionAsync();
    }
}