using DomainLayer.Contracts;
using DomainLayer.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace IntelliFit.Infrastructure.Persistence
{
    public static class SpecificationEvaluator
    {
        public static IQueryable<TEntity> CreateQuery<TEntity, TKey>(IQueryable<TEntity> inputQuery, ISpecification<TEntity, TKey> specification) where TEntity : BaseEntity<TKey>
        {
            var query = inputQuery;

            if (specification == null)
                return query;

            if (specification.Criteria != null)
                query = query.Where(specification.Criteria);

            foreach (var include in specification.Includes)
            {
                query = query.Include(include);
            }

            if (specification.IsPagingEnabled && specification.Skip.HasValue && specification.Take.HasValue)
            {
                query = query.Skip(specification.Skip.Value).Take(specification.Take.Value);
            }

            return query;
        }
    }
}
