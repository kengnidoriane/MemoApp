// Caching strategies for better UX
import React from 'react';
import { errorTracker } from './errorTracking';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  strategy?: 'lru' | 'lfu' | 'fifo'; // Eviction strategy
}

// In-memory cache with different eviction strategies
export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = []; // For LRU
  private maxSize: number;
  private strategy: 'lru' | 'lfu' | 'fifo';

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.strategy = options.strategy || 'lru';
  }

  set(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    // Remove expired entries first
    this.cleanup();

    // If at capacity, evict based on strategy
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access statistics
    entry.hits++;
    this.updateAccessOrder(key);

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    this.removeFromAccessOrder(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });
  }

  private evict(): void {
    let keyToEvict: string | undefined;

    switch (this.strategy) {
      case 'lru':
        keyToEvict = this.accessOrder[0];
        break;
      case 'lfu':
        keyToEvict = this.getLeastFrequentlyUsed();
        break;
      case 'fifo':
        keyToEvict = this.cache.keys().next().value;
        break;
      default:
        keyToEvict = this.accessOrder[0];
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
    }
  }

  private getLeastFrequentlyUsed(): string {
    let minHits = Infinity;
    let leastUsedKey = '';

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    strategy: string;
  } {
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // +1 for the initial set
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      strategy: this.strategy,
    };
  }
}

// IndexedDB cache for persistent storage
export class IndexedDBCache {
  private dbName: string;
  private version: number;
  private storeName: string;

  constructor(dbName: string = 'memoapp-cache', version: number = 1, storeName: string = 'cache') {
    this.dbName = dbName;
    this.version = version;
    this.storeName = storeName;
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async set<T>(key: string, value: T, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const entry = {
      key,
      data: value,
      timestamp: Date.now(),
      ttl,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data as T);
      };
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async cleanup(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('timestamp');

    const now = Date.now();
    const expiredKeys: string[] = [];

    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          if (now - entry.timestamp > entry.ttl) {
            expiredKeys.push(entry.key);
          }
          cursor.continue();
        } else {
          // Delete expired entries
          Promise.all(expiredKeys.map(key => this.delete(key)))
            .then(() => resolve())
            .catch(reject);
        }
      };
    });
  }
}

// HTTP cache with stale-while-revalidate strategy
export class HTTPCache {
  private memoryCache = new MemoryCache<any>();
  private persistentCache = new IndexedDBCache();

  async fetch<T>(
    url: string,
    options: RequestInit = {},
    cacheOptions: {
      ttl?: number;
      staleWhileRevalidate?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url, options);
    const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true, forceRefresh = false } = cacheOptions;

    // Check memory cache first
    if (!forceRefresh) {
      const memoryResult = this.memoryCache.get(cacheKey);
      if (memoryResult) {
        return memoryResult;
      }

      // Check persistent cache
      const persistentResult = await this.persistentCache.get<T>(cacheKey);
      if (persistentResult) {
        // Store in memory cache for faster access
        this.memoryCache.set(cacheKey, persistentResult, ttl);
        
        // If stale-while-revalidate, fetch fresh data in background
        if (staleWhileRevalidate) {
          this.fetchAndCache(url, options, cacheKey, ttl).catch(console.error);
        }
        
        return persistentResult;
      }
    }

    // Fetch fresh data
    return this.fetchAndCache(url, options, cacheKey, ttl);
  }

  private async fetchAndCache<T>(
    url: string,
    options: RequestInit,
    cacheKey: string,
    ttl: number
  ): Promise<T> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache in both memory and persistent storage
    this.memoryCache.set(cacheKey, data, ttl);
    await this.persistentCache.set(cacheKey, data, ttl);

    return data;
  }

  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body ? JSON.stringify(options.body) : '';
    
    return `${method}:${url}:${headers}:${body}`;
  }

  async invalidate(_pattern: string | RegExp): Promise<void> {
    // This would require implementing pattern matching for cache keys
    // For now, we'll clear all caches
    this.memoryCache.clear();
    await this.persistentCache.clear();
  }

  getStats() {
    return this.memoryCache.getStats();
  }
}

// React hooks for caching
export const useMemoryCache = <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
  const [cache] = React.useState(() => new MemoryCache<T>());
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    // Check cache first
    const cached = cache.get(key);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cache, ttl]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = React.useCallback(() => {
    cache.delete(key);
    fetchData();
  }, [key, cache, fetchData]);

  return { data, loading, error, invalidate };
};

export const useHTTPCache = <T>(
  url: string,
  options?: RequestInit,
  cacheOptions?: { ttl?: number; staleWhileRevalidate?: boolean }
) => {
  const [httpCache] = React.useState(() => new HTTPCache());
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await httpCache.fetch<T>(url, options, {
        ...cacheOptions,
        forceRefresh,
      });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url, options, cacheOptions, httpCache]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = React.useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refresh };
};

// Service Worker cache strategies
export const registerCacheStrategies = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // Send cache strategy configuration to service worker
      registration.active?.postMessage({
        type: 'CACHE_STRATEGIES',
        strategies: {
          '/api/': 'networkFirst',
          '/static/': 'cacheFirst',
          '/images/': 'staleWhileRevalidate',
          '/fonts/': 'cacheFirst',
          '/icons/': 'cacheFirst',
        },
      });
    });
  }
};

// Enhanced caching with performance monitoring
export class SmartCache {
  private hitCount = 0;
  private missCount = 0;
  private totalRequestTime = 0;
  private memoryCache = new MemoryCache<any>();
  private persistentCache = new IndexedDBCache();
  private performanceMetrics: Array<{
    timestamp: number;
    operation: 'hit' | 'miss' | 'set';
    duration: number;
    cacheType: 'memory' | 'persistent' | 'network';
    size?: number;
  }> = [];

  async fetch<T>(
    url: string,
    options: RequestInit = {},
    cacheOptions: {
      ttl?: number;
      staleWhileRevalidate?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();
    const cacheKey = this.buildCacheKey(url, options);
    const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true, forceRefresh = false } = cacheOptions;
    
    // Check memory cache first
    if (!forceRefresh) {
      const memoryStartTime = performance.now();
      const memoryResult = this.memoryCache.get(cacheKey);
      if (memoryResult) {
        const memoryDuration = performance.now() - memoryStartTime;
        this.hitCount++;
        
        this.recordPerformanceMetric({
          timestamp: Date.now(),
          operation: 'hit',
          duration: memoryDuration,
          cacheType: 'memory',
        });

        errorTracker.capturePerformanceMetric({
          name: 'cache-hit',
          value: memoryDuration,
          tags: {
            type: 'cache-performance',
            cacheType: 'memory',
            url: url.replace(/\/\d+/g, '/:id'),
          },
        });

        return memoryResult as T;
      }

      // Check persistent cache
      const persistentStartTime = performance.now();
      const persistentResult = await this.persistentCache.get<T>(cacheKey);
      if (persistentResult) {
        const persistentDuration = performance.now() - persistentStartTime;
        this.hitCount++;
        
        this.recordPerformanceMetric({
          timestamp: Date.now(),
          operation: 'hit',
          duration: persistentDuration,
          cacheType: 'persistent',
        });

        // Store in memory cache for faster access
        this.memoryCache.set(cacheKey, persistentResult, ttl);
        
        // If stale-while-revalidate, fetch fresh data in background
        if (staleWhileRevalidate) {
          this.fetchAndCache(url, options, cacheKey, ttl).catch(console.error);
        }

        errorTracker.capturePerformanceMetric({
          name: 'cache-hit',
          value: persistentDuration,
          tags: {
            type: 'cache-performance',
            cacheType: 'persistent',
            url: url.replace(/\/\d+/g, '/:id'),
          },
        });
        
        return persistentResult as T;
      }
    }

    this.missCount++;

    try {
      const result = await this.fetchAndCache(url, options, cacheKey, ttl);
      const duration = performance.now() - startTime;
      this.totalRequestTime += duration;

      this.recordPerformanceMetric({
        timestamp: Date.now(),
        operation: 'miss',
        duration,
        cacheType: 'network',
      });

      // Report cache performance
      errorTracker.capturePerformanceMetric({
        name: 'cache-miss',
        value: duration,
        tags: {
          type: 'cache-performance',
          cacheType: 'network',
          url: url.replace(/\/\d+/g, '/:id'),
        },
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.totalRequestTime += duration;
      
      errorTracker.reportNetworkError(
        url,
        0,
        'Cache fetch failed',
        duration
      );
      
      throw error;
    }
  }

  private recordPerformanceMetric(metric: {
    timestamp: number;
    operation: 'hit' | 'miss' | 'set';
    duration: number;
    cacheType: 'memory' | 'persistent' | 'network';
    size?: number;
  }): void {
    this.performanceMetrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  private async fetchAndCache<T>(
    url: string,
    options: RequestInit,
    cacheKey: string,
    ttl: number
  ): Promise<T> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache in both memory and persistent storage
    this.memoryCache.set(cacheKey, data, ttl);
    await this.persistentCache.set(cacheKey, data, ttl);

    return data;
  }

  getCacheStats() {
    const totalRequests = this.hitCount + this.missCount;
    const recentMetrics = this.performanceMetrics.filter(m => Date.now() - m.timestamp < 60000); // Last minute
    
    // Calculate performance by cache type
    const memoryHits = recentMetrics.filter(m => m.cacheType === 'memory' && m.operation === 'hit');
    const persistentHits = recentMetrics.filter(m => m.cacheType === 'persistent' && m.operation === 'hit');
    const networkMisses = recentMetrics.filter(m => m.cacheType === 'network' && m.operation === 'miss');
    
    return {
      size: this.memoryCache.size(),
      maxSize: 100, // Default max size
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      averageRequestTime: totalRequests > 0 ? this.totalRequestTime / totalRequests : 0,
      strategy: 'lru',
      performanceBreakdown: {
        memoryHitTime: memoryHits.length > 0 
          ? memoryHits.reduce((sum, m) => sum + m.duration, 0) / memoryHits.length 
          : 0,
        persistentHitTime: persistentHits.length > 0 
          ? persistentHits.reduce((sum, m) => sum + m.duration, 0) / persistentHits.length 
          : 0,
        networkMissTime: networkMisses.length > 0 
          ? networkMisses.reduce((sum, m) => sum + m.duration, 0) / networkMisses.length 
          : 0,
      },
      recentActivity: {
        memoryHits: memoryHits.length,
        persistentHits: persistentHits.length,
        networkMisses: networkMisses.length,
      },
    };
  }

  private buildCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body ? JSON.stringify(options.body) : '';
    
    return `${method}:${url}:${headers}:${body}`;
  }
}

// Preloading strategy for critical resources
export class ResourcePreloader {
  private preloadedResources = new Set<string>();
  private preloadQueue: Array<{ url: string; priority: 'high' | 'medium' | 'low' }> = [];

  preloadCriticalResources(): void {
    // Preload critical CSS
    this.preloadResource('/assets/index.css', 'high');
    
    // Preload critical JavaScript chunks
    this.preloadResource('/assets/react-vendor.js', 'high');
    this.preloadResource('/assets/router-vendor.js', 'medium');
    
    // Preload fonts
    this.preloadResource('/fonts/inter-var.woff2', 'high');
    
    // Process queue
    this.processPreloadQueue();
  }

  preloadResource(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (this.preloadedResources.has(url)) {
      return;
    }

    this.preloadQueue.push({ url, priority });
    this.preloadedResources.add(url);
  }

  private processPreloadQueue(): void {
    // Sort by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process queue with requestIdleCallback
    const processNext = () => {
      if (this.preloadQueue.length === 0) return;

      const { url } = this.preloadQueue.shift()!;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      
      // Determine resource type
      if (url.includes('.css')) {
        link.as = 'style';
      } else if (url.includes('.js')) {
        link.as = 'script';
      } else if (url.includes('.woff') || url.includes('.woff2')) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp')) {
        link.as = 'image';
      }

      document.head.appendChild(link);

      // Continue processing
      if ('requestIdleCallback' in window) {
        requestIdleCallback(processNext);
      } else {
        setTimeout(processNext, 0);
      }
    };

    processNext();
  }

  preloadRouteChunk(routeName: string): void {
    const chunkUrl = `/assets/${routeName}.js`;
    this.preloadResource(chunkUrl, 'low');
    this.processPreloadQueue();
  }
}

export default {
  MemoryCache,
  IndexedDBCache,
  HTTPCache,
  useMemoryCache,
  useHTTPCache,
  registerCacheStrategies,
};