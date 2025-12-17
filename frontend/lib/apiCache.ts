// ============================================================
// API CACHE UTILITY
// ============================================================
// Performance optimization: Cache API responses to reduce server load
// and improve response times (target: under 100ms for cached requests)

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // Time to live in milliseconds

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > this.defaultTTL) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Wrapper for async functions with caching
   */
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    this.set(key, data);

    return data;
  }
}

// Export singleton instance
export const apiCache = new APICache();

// Export convenience functions
export const getCached = <T>(key: string): T | null => apiCache.get<T>(key);
export const setCached = <T>(key: string, data: T): void => apiCache.set(key, data);
export const clearCache = (key: string): void => apiCache.clear(key);
export const clearAllCache = (): void => apiCache.clearAll();

export default apiCache;
