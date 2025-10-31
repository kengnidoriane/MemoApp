// Performance optimization utilities
import React from 'react';

// Simple debounce implementation
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// Simple throttle implementation
const throttle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  }) as T;
};

// Bundle optimization utilities
export const lazyImport = <T extends Record<string, any>>(
  importFn: () => Promise<T>
) => {
  return importFn;
};

// Component lazy loading with error boundaries
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => 
    React.createElement(
      React.Suspense,
      { fallback: fallback ? React.createElement(fallback) : React.createElement('div', null, 'Loading...') },
      React.createElement(LazyComponent as any, { ...props, ref })
    )
  );
};

// Memory optimization
export class MemoryOptimizer {
  private static cache = new Map<string, any>();
  private static maxCacheSize = 100;

  static memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const result = fn(...args);
      
      // Prevent memory leaks by limiting cache size
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
      
      this.cache.set(key, result);
      return result;
    }) as T;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static getCacheSize(): number {
    return this.cache.size;
  }
}

// Image optimization
export const optimizeImage = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
): string => {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // In a real implementation, this would integrate with an image optimization service
  // For now, we'll return the original src with query parameters
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);
  
  return `${src}?${params.toString()}`;
};

// Virtual scrolling for large lists
export class VirtualScrollManager {
  private containerHeight: number;
  private itemHeight: number;
  private totalItems: number;
  private scrollTop: number = 0;

  constructor(containerHeight: number, itemHeight: number, totalItems: number) {
    this.containerHeight = containerHeight;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
  }

  getVisibleRange(): { start: number; end: number; offset: number } {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const start = Math.floor(this.scrollTop / this.itemHeight);
    const end = Math.min(start + visibleCount + 1, this.totalItems);
    const offset = start * this.itemHeight;

    return { start, end, offset };
  }

  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }
}

// Performance monitoring hooks
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = React.useRef<number | undefined>();
  const [renderTime, setRenderTime] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    renderStartTime.current = performance.now();
  });

  React.useEffect(() => {
    if (renderStartTime.current) {
      const endTime = performance.now();
      const duration = endTime - renderStartTime.current;
      setRenderTime(duration);
      
      // Log slow renders
      if (duration > 16) { // More than one frame at 60fps
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    }
  }, [componentName]);

  return { renderTime };
};

// Debounced and throttled utilities
export const createDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  return debounce(callback, delay) as T;
};

export const createThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  return throttle(callback, delay) as T;
};

// Network optimization
export class NetworkOptimizer {
  private static requestCache = new Map<string, Promise<any>>();
  private static pendingRequests = new Set<string>();

  static async optimizedFetch<T>(
    url: string,
    options: RequestInit = {},
    cacheTime: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    // Return cached promise if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }

    // Check cache
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }

    // Make request
    this.pendingRequests.add(cacheKey);
    
    const requestPromise = fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .finally(() => {
        this.pendingRequests.delete(cacheKey);
        // Clear cache after specified time
        setTimeout(() => {
          this.requestCache.delete(cacheKey);
        }, cacheTime);
      });

    this.requestCache.set(cacheKey, requestPromise);
    return requestPromise;
  }

  static clearCache(): void {
    this.requestCache.clear();
    this.pendingRequests.clear();
  }
}

// Code splitting utilities
export const preloadRoute = (routeImport: () => Promise<any>): void => {
  // Preload route component during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routeImport();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      routeImport();
    }, 100);
  }
};

// Resource hints
export const addResourceHint = (
  href: string,
  rel: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch',
  as?: string
): void => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (as) link.as = as;
  document.head.appendChild(link);
};

// Critical CSS inlining
export const inlineCriticalCSS = (css: string): void => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

// Service Worker utilities
export const registerServiceWorker = async (
  swPath: string = '/sw.js'
): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Performance budget checker
export const checkPerformanceBudget = (): {
  passed: boolean;
  violations: Array<{ metric: string; actual: number; budget: number }>;
} => {
  const budgets = {
    FCP: 1800, // First Contentful Paint
    LCP: 2500, // Largest Contentful Paint
    FID: 100,  // First Input Delay
    CLS: 0.1,  // Cumulative Layout Shift
  };

  const violations: Array<{ metric: string; actual: number; budget: number }> = [];

  // Check Web Vitals (simplified - in real implementation would use web-vitals library)
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigation) {
    const fcp = navigation.responseEnd - navigation.fetchStart;
    if (fcp > budgets.FCP) {
      violations.push({ metric: 'FCP', actual: fcp, budget: budgets.FCP });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
};

export default {
  MemoryOptimizer,
  VirtualScrollManager,
  NetworkOptimizer,
  lazyImport,
  createLazyComponent,
  optimizeImage,
  usePerformanceMonitor,
  createDebouncedCallback,
  createThrottledCallback,
  preloadRoute,
  addResourceHint,
  inlineCriticalCSS,
  registerServiceWorker,
  checkPerformanceBudget,
};