using System.Linq.Expressions;
using DomainLayer.Contracts;
using DomainLayer.Models;

namespace Core.Service.Specifications
{
    public abstract class BaseSpecification<TEntity, TKey> : ISpecification<TEntity, TKey> where TEntity : BaseEntity<TKey>
    {
        public Expression<Func<TEntity, bool>>? Criteria { get; protected set; }
        public List<Expression<Func<TEntity, object>>> Includes { get; } = new();
        public int? Take { get; protected set; }
        public int? Skip { get; protected set; }
        public bool IsPagingEnabled { get; protected set; }

        protected void AddInclude(Expression<Func<TEntity, object>> includeExpression) => Includes.Add(includeExpression);
        protected void ApplyPaging(int skip, int take) { Skip = skip; Take = take; IsPagingEnabled = true; }
        protected void SetCriteria(Expression<Func<TEntity, bool>> criteria) => Criteria = criteria;
    }
}
