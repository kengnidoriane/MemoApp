// Comprehensive performance optimization service
import React from 'react';
import { errorTracker } from '../utils/errorTracking';
import { webVitalsService } from './webVitalsService';
import { performanceMonitoringService } from './performanceMonitoringService';
import { SmartCache, ResourcePreloader } from '../utils/cachingStrategies';

export interface PerformanceConfig {
  enableWebVitals: boolean;
  enableResourcePreloading: boolean;
  enableSmartCaching: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  budgets: {
    bundleSize: number; // in KB
    loadTime: number; // in ms
    memoryUsage: number; // in MB
  };
}

class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private config: PerformanceConfig;
  private smartCache: SmartCache;
  private resourcePreloader: ResourcePreloader;
  private performanceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableWebVitals: true,
      enableResourcePreloading: true,
      enableSmartCaching: true,
      enableImageOptimization: true,
      enableCodeSplitting: true,
      budgets: {
        bundleSize: 1000, // 1MB
        loadTime: 3000, // 3 seconds
        memoryUsage: 50, // 50MB
      },
      ...config,
    };

    this.smartCache = new SmartCache();
    this.resourcePreloader = new ResourcePreloader();
    
    this.initialize();
  }

  static getInstance(config?: Partial<PerformanceConfig>): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService(config);
    }
    return PerformanceOptimizationService.instance;
  }

  private initialize(): void {
    if (this.config.enableResourcePreloading) {
      this.initializeResourcePreloading();
    }

    if (this.config.enableImageOptimization) {
      this.initializeImageOptimization();
    }

    this.initializePerformanceMonitoring();
    this.initializeBudgetMonitoring();
  }

  private initializeResourcePreloading(): void {
    // Preload critical resources on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.resourcePreloader.preloadCriticalResources();
      });
    } else {
      this.resourcePreloader.preloadCriticalResources();
    }

    // Preload route chunks on hover
    this.setupRoutePreloading();
  }

  private setupRoutePreloading(): void {
    // Preload route chunks when user hovers over navigation links
    const preloadOnHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href.startsWith(window.location.origin)) {
        const path = new URL(link.href).pathname;
        const routeName = this.getRouteNameFromPath(path);
        if (routeName) {
          this.resourcePreloader.preloadRouteChunk(routeName);
        }
      }
    };

    document.addEventListener('mouseover', preloadOnHover);
    
    // Cleanup on unmount would be handled by the component using this service
  }

  private getRouteNameFromPath(path: string): string | null {
    // Map paths to chunk names
    const routeMap: Record<string, string> = {
      '/': 'home',
      '/memos': 'memos',
      '/quiz': 'quiz',
      '/analytics': 'analytics',
      '/settings': 'settings',
    };

    return routeMap[path] || null;
  }

  private initializeImageOptimization(): void {
    // Lazy load images with Intersection Observer
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              this.intersectionObserver?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    // Observe existing images
    this.observeImages();

    // Observe new images added to DOM
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const images = element.querySelectorAll('img[data-src]');
            images.forEach((img) => this.intersectionObserver?.observe(img));
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private observeImages(): void {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => this.intersectionObserver?.observe(img));
  }

  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        this.performanceObserver.observe({
          entryTypes: ['measure', 'navigation', 'resource', 'longtask'],
        });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    // Monitor long tasks (blocking main thread)
    if (entry.entryType === 'longtask') {
      errorTracker.capturePerformanceMetric({
        name: 'long-task',
        value: entry.duration,
        tags: {
          type: 'performance-issue',
          severity: entry.duration > 100 ? 'high' : 'medium',
        },
      });

      if (entry.duration > 50) {
        errorTracker.reportError(
          `Long task detected: ${entry.duration}ms`,
          {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          },
          entry.duration > 100 ? 'high' : 'medium'
        );
      }
    }

    // Monitor resource loading
    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming;
      
      errorTracker.capturePerformanceMetric({
        name: 'resource-load-time',
        value: resourceEntry.duration,
        tags: {
          type: 'resource-performance',
          resourceType: this.getResourceType(resourceEntry.name),
          size: resourceEntry.transferSize?.toString() || 'unknown',
        },
      });

      // Check for slow resources
      if (resourceEntry.duration > 2000) {
        errorTracker.reportError(
          `Slow resource loading: ${resourceEntry.name}`,
          {
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize,
            type: this.getResourceType(resourceEntry.name),
          },
          'medium'
        );
      }
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp')) return 'image';
    if (url.includes('.woff') || url.includes('.woff2')) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private initializeBudgetMonitoring(): void {
    // Check performance budgets periodically
    const checkBudgets = () => {
      const violations = this.checkPerformanceBudgets();
      
      if (violations.length > 0) {
        errorTracker.reportError(
          'Performance budget violations detected',
          { violations },
          'medium'
        );
      }
    };

    // Check budgets after initial load
    setTimeout(checkBudgets, 5000);
    
    // Check budgets periodically
    setInterval(checkBudgets, 60000); // Every minute
  }

  checkPerformanceBudgets(): Array<{ metric: string; actual: number; budget: number }> {
    const violations: Array<{ metric: string; actual: number; budget: number }> = [];

    // Check bundle size (approximate from resource timing)
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const totalBundleSize = resources
      .filter(r => r.name.includes('.js'))
      .reduce((sum, r) => sum + (r.transferSize || 0), 0);

    if (totalBundleSize > this.config.budgets.bundleSize * 1024) {
      violations.push({
        metric: 'bundle-size',
        actual: Math.round(totalBundleSize / 1024),
        budget: this.config.budgets.bundleSize,
      });
    }

    // Check load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      if (loadTime > this.config.budgets.loadTime) {
        violations.push({
          metric: 'load-time',
          actual: Math.round(loadTime),
          budget: this.config.budgets.loadTime,
        });
      }
    }

    // Check memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024);
      
      if (memoryUsageMB > this.config.budgets.memoryUsage) {
        violations.push({
          metric: 'memory-usage',
          actual: Math.round(memoryUsageMB),
          budget: this.config.budgets.memoryUsage,
        });
      }
    }

    return violations;
  }

  // Optimize images dynamically
  optimizeImage(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      lazy?: boolean;
    } = {}
  ): { src: string; srcSet?: string; loading?: 'lazy' | 'eager' } {
    const { width, height, quality = 80, format = 'webp', lazy = true } = options;
    
    // Generate optimized URL (in real implementation, this would use an image service)
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', format);
    
    const optimizedSrc = `${src}?${params.toString()}`;
    
    // Generate srcSet for responsive images
    const srcSet = width ? [
      `${src}?w=${Math.round(width * 0.5)}&q=${quality}&f=${format} ${Math.round(width * 0.5)}w`,
      `${src}?w=${width}&q=${quality}&f=${format} ${width}w`,
      `${src}?w=${Math.round(width * 1.5)}&q=${quality}&f=${format} ${Math.round(width * 1.5)}w`,
    ].join(', ') : undefined;

    return {
      src: optimizedSrc,
      srcSet,
      loading: lazy ? 'lazy' : 'eager',
    };
  }

  // Code splitting utilities
  preloadComponent(componentImport: () => Promise<any>): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        componentImport().catch(console.error);
      });
    } else {
      setTimeout(() => {
        componentImport().catch(console.error);
      }, 100);
    }
  }

  // Get comprehensive performance report
  getPerformanceReport(): {
    webVitals: ReturnType<typeof webVitalsService.generateReport>;
    syncPerformance: ReturnType<typeof performanceMonitoringService.generatePerformanceReport>;
    cacheStats: ReturnType<typeof this.smartCache.getCacheStats>;
    budgetCheck: ReturnType<typeof this.checkPerformanceBudgets>;
    recommendations: string[];
    performanceScore: number;
    criticalIssues: Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low' }>;
    timestamp: Date;
  } {
    const webVitals = webVitalsService.generateReport();
    const syncPerformance = performanceMonitoringService.generatePerformanceReport();
    const cacheStats = this.smartCache.getCacheStats();
    const budgetCheck = this.checkPerformanceBudgets();
    
    const recommendations: string[] = [
      ...webVitals.recommendations,
    ];

    const criticalIssues: Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low' }> = [];

    // Add budget-based recommendations and issues
    budgetCheck.forEach(violation => {
      switch (violation.metric) {
        case 'bundle-size':
          recommendations.push('Consider code splitting and lazy loading to reduce bundle size');
          criticalIssues.push({
            type: 'bundle-size',
            message: `Bundle size exceeds budget: ${violation.actual}KB > ${violation.budget}KB`,
            severity: 'medium',
          });
          break;
        case 'load-time':
          recommendations.push('Optimize critical rendering path and reduce blocking resources');
          criticalIssues.push({
            type: 'load-time',
            message: `Load time exceeds budget: ${violation.actual}ms > ${violation.budget}ms`,
            severity: 'high',
          });
          break;
        case 'memory-usage':
          recommendations.push('Review memory usage and implement proper cleanup in components');
          criticalIssues.push({
            type: 'memory-usage',
            message: `Memory usage exceeds budget: ${violation.actual}MB > ${violation.budget}MB`,
            severity: 'high',
          });
          break;
      }
    });

    // Add cache-based recommendations and issues
    if (cacheStats.hitRate < 0.7) {
      recommendations.push('Improve caching strategy to increase cache hit rate');
      if (cacheStats.hitRate < 0.5) {
        criticalIssues.push({
          type: 'cache-performance',
          message: `Low cache hit rate: ${Math.round(cacheStats.hitRate * 100)}%`,
          severity: 'medium',
        });
      }
    }

    // Add sync performance recommendations
    if (syncPerformance.reliability.successRate < 0.95) {
      recommendations.push('Improve sync reliability and error handling');
      criticalIssues.push({
        type: 'sync-reliability',
        message: `Low sync success rate: ${Math.round(syncPerformance.reliability.successRate * 100)}%`,
        severity: 'high',
      });
    }

    if (syncPerformance.reliability.averageResponseTime > 3000) {
      recommendations.push('Optimize sync operations to reduce response time');
      criticalIssues.push({
        type: 'sync-performance',
        message: `Slow sync operations: ${Math.round(syncPerformance.reliability.averageResponseTime)}ms average`,
        severity: 'medium',
      });
    }

    // Add JavaScript performance recommendations
    if (syncPerformance.jsPerformance.totalBlockingTime > 300) {
      recommendations.push('Optimize JavaScript execution to reduce main thread blocking');
      criticalIssues.push({
        type: 'javascript-performance',
        message: `High total blocking time: ${Math.round(syncPerformance.jsPerformance.totalBlockingTime)}ms`,
        severity: 'high',
      });
    }

    // Add bundle performance recommendations
    if (syncPerformance.bundleMetrics.cacheHitRate < 0.8) {
      recommendations.push('Improve bundle caching strategy');
    }

    if (syncPerformance.bundleMetrics.largestBundle && syncPerformance.bundleMetrics.largestBundle.size > 500 * 1024) {
      recommendations.push(`Consider splitting large bundle: ${syncPerformance.bundleMetrics.largestBundle.name}`);
      criticalIssues.push({
        type: 'bundle-size',
        message: `Large bundle detected: ${syncPerformance.bundleMetrics.largestBundle.name} (${Math.round(syncPerformance.bundleMetrics.largestBundle.size / 1024)}KB)`,
        severity: 'medium',
      });
    }

    // Calculate overall performance score
    const performanceScore = this.calculatePerformanceScore(webVitals, syncPerformance, cacheStats, budgetCheck);

    return {
      webVitals,
      syncPerformance,
      cacheStats,
      budgetCheck,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      performanceScore,
      criticalIssues,
      timestamp: new Date(),
    };
  }

  private calculatePerformanceScore(
    webVitals: any,
    syncPerformance: any,
    cacheStats: any,
    budgetCheck: any
  ): number {
    const weights = {
      webVitals: 0.3,
      syncPerformance: 0.25,
      cachePerformance: 0.2,
      budgetCompliance: 0.15,
      jsPerformance: 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Web Vitals score (0-100)
    const webVitalsScore = webVitals.performanceScore?.score || 0;
    totalScore += webVitalsScore * weights.webVitals;
    totalWeight += weights.webVitals;

    // Sync performance score (0-100)
    const syncScore = Math.min(100, syncPerformance.reliability.successRate * 100);
    totalScore += syncScore * weights.syncPerformance;
    totalWeight += weights.syncPerformance;

    // Cache performance score (0-100)
    const cacheScore = Math.min(100, cacheStats.hitRate * 100);
    totalScore += cacheScore * weights.cachePerformance;
    totalWeight += weights.cachePerformance;

    // Budget compliance score (0-100)
    const budgetScore = budgetCheck.violations.length === 0 ? 100 : Math.max(0, 100 - (budgetCheck.violations.length * 25));
    totalScore += budgetScore * weights.budgetCompliance;
    totalWeight += weights.budgetCompliance;

    // JavaScript performance score (0-100)
    const jsScore = syncPerformance.jsPerformance.totalBlockingTime < 100 ? 100 : 
                   syncPerformance.jsPerformance.totalBlockingTime < 300 ? 70 : 
                   syncPerformance.jsPerformance.totalBlockingTime < 500 ? 40 : 0;
    totalScore += jsScore * weights.jsPerformance;
    totalWeight += weights.jsPerformance;

    return Math.round(totalScore / totalWeight);
  }

  // Cleanup resources
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

// React hook for performance optimization
export const usePerformanceOptimization = (config?: Partial<PerformanceConfig>) => {
  const [service] = React.useState(() => PerformanceOptimizationService.getInstance(config));
  
  React.useEffect(() => {
    return () => service.destroy();
  }, [service]);

  const optimizeImage = React.useCallback((src: string, options?: Parameters<typeof service.optimizeImage>[1]) => {
    return service.optimizeImage(src, options);
  }, [service]);

  const preloadComponent = React.useCallback((componentImport: () => Promise<any>) => {
    service.preloadComponent(componentImport);
  }, [service]);

  const getPerformanceReport = React.useCallback(() => {
    return service.getPerformanceReport();
  }, [service]);

  const checkBudgets = React.useCallback(() => {
    return service.checkPerformanceBudgets();
  }, [service]);

  return {
    optimizeImage,
    preloadComponent,
    getPerformanceReport,
    checkBudgets,
  };
};

export const performanceOptimizationService = PerformanceOptimizationService.getInstance();

export default {
  PerformanceOptimizationService,
  performanceOptimizationService,
  usePerformanceOptimization,
};