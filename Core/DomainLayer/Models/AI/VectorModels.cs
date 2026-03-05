using System;

namespace IntelliFit.Domain.Models.AI
{
    /// <summary>
    /// Stores vector embeddings for semantic search and RAG (Retrieval-Augmented Generation).
    /// Used with PostgreSQL pgvector extension or external vector DB.
    /// 
    /// WHY THIS EXISTS:
    /// - Enables semantic search for exercise recommendations ("find exercises similar to bench press")
    /// - Supports RAG for AI workout generation (retrieve relevant fitness knowledge)
    /// - Allows finding similar user profiles for collaborative filtering
    /// </summary>
    public class VectorEmbedding
    {
        public int EmbeddingId { get; set; }

        /// <summary>
        /// Type of content: "exercise", "workout_plan", "knowledge_base", "user_profile"
        /// </summary>
        public string ContentType { get; set; } = null!;

        /// <summary>
        /// Reference ID in the source table
        /// </summary>
        public int ContentId { get; set; }

        /// <summary>
        /// The text that was embedded (for debugging/re-embedding)
        /// </summary>
        public string SourceText { get; set; } = null!;

        /// <summary>
        /// Vector embedding - stored as array for pgvector compatibility
        /// Typical dimensions: 384 (MiniLM), 768 (BERT), 1536 (OpenAI Ada)
        /// </summary>
        /// <remarks>
        /// In PostgreSQL with pgvector: 
        /// ALTER TABLE vector_embeddings ADD COLUMN embedding vector(1536);
        /// CREATE INDEX ON vector_embeddings USING ivfflat (embedding vector_cosine_ops);
        /// </remarks>
        public float[]? Embedding { get; set; }

        /// <summary>
        /// Embedding model used (for version tracking)
        /// </summary>
        public string EmbeddingModel { get; set; } = "text-embedding-ada-002";

        /// <summary>
        /// Dimension of the embedding vector
        /// </summary>
        public int EmbeddingDimension { get; set; } = 1536;

        /// <summary>
        /// Additional metadata as JSON (for filtering during search)
        /// </summary>
        public string? Metadata { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Stores fitness knowledge for RAG retrieval.
    /// This is the knowledge base that AI uses to generate contextual responses.
    /// </summary>
    public class FitnessKnowledge
    {
        public int KnowledgeId { get; set; }

        /// <summary>
        /// Category: "exercise_technique", "nutrition", "recovery", "injury_prevention", "workout_programming"
        /// </summary>
        public string Category { get; set; } = null!;

        /// <summary>
        /// Subcategory for finer classification
        /// </summary>
        public string? Subcategory { get; set; }

        /// <summary>
        /// Title/heading of the knowledge article
        /// </summary>
        public string Title { get; set; } = null!;

        /// <summary>
        /// The actual knowledge content
        /// </summary>
        public string Content { get; set; } = null!;

        /// <summary>
        /// Source of knowledge: "expert_guideline", "research_paper", "coach_created"
        /// </summary>
        public string Source { get; set; } = "expert_guideline";

        /// <summary>
        /// Relevance tags for filtering
        /// </summary>
        public string[]? Tags { get; set; }

        /// <summary>
        /// Target muscle groups this applies to
        /// </summary>
        public string[]? MuscleGroups { get; set; }

        /// <summary>
        /// Fitness levels this is appropriate for
        /// </summary>
        public string[]? FitnessLevels { get; set; }

        /// <summary>
        /// Priority for retrieval (higher = more likely to be included)
        /// </summary>
        public float Priority { get; set; } = 1.0f;

        /// <summary>
        /// Is this active for retrieval?
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Who created/approved this knowledge
        /// </summary>
        public int? CreatedByUserId { get; set; }
        public int? ApprovedByUserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual User? CreatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }
    }
}
