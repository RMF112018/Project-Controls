interface ICacheEntry<T> {
  data: T;
  expiry: number;
}

export class CacheService {
  private memoryCache: Map<string, ICacheEntry<unknown>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTLMs: number = 15 * 60 * 1000) {
    this.defaultTTL = defaultTTLMs;
  }

  get<T>(key: string): T | null {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key) as ICacheEntry<T> | undefined;
    if (memEntry && Date.now() < memEntry.expiry) {
      return memEntry.data;
    }

    // Fall back to sessionStorage
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const entry: ICacheEntry<T> = JSON.parse(stored);
        if (Date.now() < entry.expiry) {
          // Rehydrate memory cache
          this.memoryCache.set(key, entry);
          return entry.data;
        }
        sessionStorage.removeItem(key);
      }
    } catch {
      // sessionStorage might not be available
    }

    // Clean up expired memory entry
    this.memoryCache.delete(key);
    return null;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs || this.defaultTTL);
    const entry: ICacheEntry<T> = { data, expiry };

    // Always set in memory
    this.memoryCache.set(key, entry);

    // Try sessionStorage as backup
    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Storage full or not available — memory cache still works
    }
  }

  remove(key: string): void {
    this.memoryCache.delete(key);
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  removeByPrefix(prefix: string): void {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }

  clear(): void {
    this.memoryCache.clear();
    try {
      // Only clear HBC keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('hbc_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const cacheService = new CacheService();
