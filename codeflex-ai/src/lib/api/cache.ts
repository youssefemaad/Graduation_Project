/**
 * Simple in-memory cache for API responses
 * Helps reduce redundant API calls for relatively static data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cache entry with optional TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Remove specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Remove all cache entries matching a prefix
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache key for user-specific data
   */
  userKey(userId: number, resource: string): string {
    return `user:${userId}:${resource}`;
  }
}

// Singleton instance
export const apiCache = new ApiCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30 * 1000,           // 30 seconds - for frequently changing data
  MEDIUM: 5 * 60 * 1000,      // 5 minutes - for moderately static data
  LONG: 30 * 60 * 1000,       // 30 minutes - for rarely changing data (like equipment list)
  VERY_LONG: 60 * 60 * 1000,  // 1 hour - for static reference data
};
