using System;

namespace IntelliFit.Domain.Models.Base
{
    /// <summary>
    /// Base class for all entities requiring audit tracking.
    /// Provides consistent CreatedAt/UpdatedAt/IsDeleted across all entities.
    /// </summary>
    public abstract class AuditableEntity
    {
        /// <summary>
        /// When the record was created (UTC)
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the record was last modified (UTC)
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Soft delete flag - records are never physically deleted
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// When the record was soft deleted (UTC)
        /// </summary>
        public DateTime? DeletedAt { get; set; }

        /// <summary>
        /// Who deleted this record (for audit trail)
        /// </summary>
        public int? DeletedByUserId { get; set; }
    }

    /// <summary>
    /// Base class for entities with a single integer primary key.
    /// Most entities should inherit from this.
    /// </summary>
    /// <typeparam name="TKey">Primary key type (usually int)</typeparam>
    public abstract class AuditableEntity<TKey> : AuditableEntity
    {
        public TKey Id { get; set; } = default!;
    }
}
