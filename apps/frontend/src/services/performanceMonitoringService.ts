// Performance monitoring service for sync performance and reliability
import React from 'react';
import { errorTracker } from '../utils/errorTracking';

export interface SyncPerformanceMetrics {
  operation: 'sync' | 'upload' | 'download' | 'conflict-resolution';
  duration: number;
  dataSize: number;
  itemCount: number;
  success: boolean;
  errorType?: string;
  networkType?: string;
  timestamp: Date;
}

export interface ReliabilityMetrics {
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  lastFailure?: Date;
  consecutiveFailures: number;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private syncMetrics: SyncPerformanceMetrics[] = [];
  private performanceObserver?: PerformanceObserver;
  private networkInfo?: any;

  private constructor() {
    this.initializePerformanceObserver();
    this.initializeNetworkInfo();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  private initializeNetworkInfo(): void {
    // @ts-ignore - Network Information API
    this.networkInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.name.startsWith('sync-')) {
      errorTracker.capturePerformanceMetric({
        name: entry.name,
        value: entry.duration,
        tags: {
          type: 'sync-operation',
          networkType: this.getNetworkType(),
        },
      });
    }
  }

  private getNetworkType(): string {
    if (this.networkInfo) {
      return this.networkInfo.effectiveType || this.networkInfo.type || 'unknown';
    }
    return 'unknown';
  }

  // Sync performance monitoring
  startSyncOperation(operation: SyncPerformanceMetrics['operation']): (success: boolean, dataSize?: number, itemCount?: number, errorType?: string) => void {
    const startTime = performance.now();
    const markName = `sync-${operation}-start`;
    
    performance.mark(markName);

    return (success: boolean, dataSize: number = 0, itemCount: number = 0, errorType?: string) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const endMarkName = `sync-${operation}-end`;
      const measureName = `sync-${operation}`;

      performance.mark(endMarkName);
      performance.measure(measureName, markName, endMarkName);

      const metric: SyncPerformanceMetrics = {
        operation,
        duration,
        dataSize,
        itemCount,
        success,
        errorType,
        networkType: this.getNetworkType(),
        timestamp: new Date(),
      };

      this.recordSyncMetric(metric);
    };
  }

  private recordSyncMetric(metric: SyncPerformanceMetrics): void {
    this.syncMetrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.syncMetrics.length > 100) {
      this.syncMetrics = this.syncMetrics.slice(-100);
    }

    // Report to error tracking service
    errorTracker.capturePerformanceMetric({
      name: `sync-${metric.operation}`,
      value: metric.duration,
      tags: {
        success: metric.success.toString(),
        networkType: metric.networkType || 'unknown',
        operation: metric.operation,
      },
    });

    // Log slow operations
    if (metric.duration > 5000) { // 5 seconds
      errorTracker.reportError(
        `Slow sync operation detected: ${metric.operation} took ${metric.duration}ms`,
        {
          operation: metric.operation,
          duration: metric.duration,
          dataSize: metric.dataSize,
          itemCount: metric.itemCount,
          networkType: metric.networkType,
        },
        'medium'
      );
    }

    // Log failed operations
    if (!metric.success) {
      errorTracker.reportError(
        `Sync operation failed: ${metric.operation}`,
        {
          operation: metric.operation,
          errorType: metric.errorType,
          duration: metric.duration,
          networkType: metric.networkType,
        },
        'high'
      );
    }
  }

  // Get sync performance statistics
  getSyncPerformanceStats(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalOperations: number;
    successRate: number;
    averageDuration: number;
    averageDataSize: number;
    operationBreakdown: Record<string, number>;
    networkBreakdown: Record<string, number>;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.syncMetrics.filter(m => m.timestamp.getTime() > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        successRate: 0,
        averageDuration: 0,
        averageDataSize: 0,
        operationBreakdown: {},
        networkBreakdown: {},
      };
    }

    const successfulOperations = recentMetrics.filter(m => m.success).length;
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const totalDataSize = recentMetrics.reduce((sum, m) => sum + m.dataSize, 0);

    const operationBreakdown: Record<string, number> = {};
    const networkBreakdown: Record<string, number> = {};

    recentMetrics.forEach(metric => {
      operationBreakdown[metric.operation] = (operationBreakdown[metric.operation] || 0) + 1;
      const networkType = metric.networkType || 'unknown';
      networkBreakdown[networkType] = (networkBreakdown[networkType] || 0) + 1;
    });

    return {
      totalOperations: recentMetrics.length,
      successRate: successfulOperations / recentMetrics.length,
      averageDuration: totalDuration / recentMetrics.length,
      averageDataSize: totalDataSize / recentMetrics.length,
      operationBreakdown,
      networkBreakdown,
    };
  }

  // Monitor sync reliability
  getReliabilityMetrics(timeWindow: number = 24 * 60 * 60 * 1000): ReliabilityMetrics {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.syncMetrics.filter(m => m.timestamp.getTime() > cutoff);

    if (recentMetrics.length === 0) {
      return {
        successRate: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0,
        consecutiveFailures: 0,
      };
    }

    const successfulOperations = recentMetrics.filter(m => m.success);
    const failedOperations = recentMetrics.filter(m => !m.success);
    
    const successRate = successfulOperations.length / recentMetrics.length;
    const errorRate = failedOperations.length / recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;

    // Calculate consecutive failures from the end
    let consecutiveFailures = 0;
    for (let i = recentMetrics.length - 1; i >= 0; i--) {
      if (!recentMetrics[i].success) {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    const lastFailure = failedOperations.length > 0 
      ? failedOperations[failedOperations.length - 1].timestamp 
      : undefined;

    // Calculate uptime (simplified - percentage of successful operations)
    const uptime = successRate * 100;

    return {
      successRate,
      averageResponseTime,
      errorRate,
      uptime,
      lastFailure,
      consecutiveFailures,
    };
  }

  // Network performance monitoring
  monitorNetworkPerformance(): void {
    if (this.networkInfo) {
      // Monitor network changes
      this.networkInfo.addEventListener('change', () => {
        errorTracker.capturePerformanceMetric({
          name: 'network-change',
          value: Date.now(),
          tags: {
            type: 'network-event',
            effectiveType: this.networkInfo.effectiveType,
            downlink: this.networkInfo.downlink?.toString(),
            rtt: this.networkInfo.rtt?.toString(),
          },
        });
      });
    }

    // Monitor online/offline events
    window.addEventListener('online', () => {
      errorTracker.capturePerformanceMetric({
        name: 'network-online',
        value: Date.now(),
        tags: { type: 'network-event' },
      });
    });

    window.addEventListener('offline', () => {
      errorTracker.capturePerformanceMetric({
        name: 'network-offline',
        value: Date.now(),
        tags: { type: 'network-event' },
      });
    });
  }

  // Bundle size monitoring
  monitorBundlePerformance(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.includes('.js')) {
            errorTracker.capturePerformanceMetric({
              name: 'bundle-load-time',
              value: entry.duration,
              tags: {
                type: 'bundle-performance',
                resource: entry.name,
                size: (entry as any).transferSize?.toString() || 'unknown',
              },
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource performance monitoring not supported:', error);
      }
    }
  }

  // Memory usage monitoring
  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        
        errorTracker.capturePerformanceMetric({
          name: 'memory-usage',
          value: memory.usedJSHeapSize,
          tags: {
            type: 'memory-monitoring',
            totalHeapSize: memory.totalJSHeapSize.toString(),
            heapSizeLimit: memory.jsHeapSizeLimit.toString(),
          },
        });

        // Warn about high memory usage
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          errorTracker.reportError(
            `High memory usage detected: ${usagePercent.toFixed(1)}%`,
            {
              usedHeapSize: memory.usedJSHeapSize,
              totalHeapSize: memory.totalJSHeapSize,
              heapSizeLimit: memory.jsHeapSizeLimit,
            },
            'medium'
          );
        }
      };

      // Check memory usage every 30 seconds
      setInterval(checkMemory, 30000);
      checkMemory(); // Initial check
    }
  }

  // Performance budget monitoring
  checkPerformanceBudgets(): {
    passed: boolean;
    violations: Array<{ metric: string; actual: number; budget: number }>;
  } {
    const budgets = {
      'sync-operation-duration': 3000, // 3 seconds
      'bundle-load-time': 2000, // 2 seconds
      'memory-usage': 50 * 1024 * 1024, // 50MB
    };

    const violations: Array<{ metric: string; actual: number; budget: number }> = [];

    // Check sync operation performance
    const syncStats = this.getSyncPerformanceStats();
    if (syncStats.averageDuration > budgets['sync-operation-duration']) {
      violations.push({
        metric: 'sync-operation-duration',
        actual: syncStats.averageDuration,
        budget: budgets['sync-operation-duration'],
      });
    }

    // Check memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > budgets['memory-usage']) {
        violations.push({
          metric: 'memory-usage',
          actual: memory.usedJSHeapSize,
          budget: budgets['memory-usage'],
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  // Enhanced bundle performance monitoring
  monitorBundlePerformanceEnhanced(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.includes('.js')) {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Track bundle loading metrics
            errorTracker.capturePerformanceMetric({
              name: 'bundle-load-time',
              value: entry.duration,
              tags: {
                type: 'bundle-performance',
                resource: this.getResourceName(entry.name),
                size: resourceEntry.transferSize?.toString() || 'unknown',
                cached: resourceEntry.transferSize === 0 ? 'true' : 'false',
              },
            });

            // Track bundle parse time
            const parseTime = resourceEntry.responseEnd - resourceEntry.responseStart;
            errorTracker.capturePerformanceMetric({
              name: 'bundle-parse-time',
              value: parseTime,
              tags: {
                type: 'bundle-performance',
                resource: this.getResourceName(entry.name),
              },
            });

            // Warn about large bundles
            if (resourceEntry.transferSize && resourceEntry.transferSize > 500 * 1024) {
              errorTracker.reportError(
                `Large bundle detected: ${this.getResourceName(entry.name)}`,
                {
                  size: resourceEntry.transferSize,
                  loadTime: entry.duration,
                  parseTime,
                },
                'medium'
              );
            }
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource performance monitoring not supported:', error);
      }
    }
  }

  private getResourceName(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  // Monitor Core Web Vitals integration
  monitorWebVitals(): void {
    // Monitor LCP specifically for sync operations
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          errorTracker.capturePerformanceMetric({
            name: 'lcp-during-sync',
            value: entry.startTime,
            tags: {
              type: 'web-vital-sync',
              element: (entry as any).element?.tagName || 'unknown',
            },
          });
        }
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (error) {
        console.warn('LCP monitoring not supported:', error);
      }
    }
  }

  // Monitor JavaScript execution time
  monitorJavaScriptPerformance(): void {
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          errorTracker.capturePerformanceMetric({
            name: 'long-task',
            value: entry.duration,
            tags: {
              type: 'javascript-performance',
              severity: entry.duration > 100 ? 'high' : 'medium',
            },
          });

          // Report blocking tasks
          if (entry.duration > 50) {
            errorTracker.reportError(
              `Long task blocking main thread: ${entry.duration}ms`,
              {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              },
              entry.duration > 100 ? 'high' : 'medium'
            );
          }
        }
      });

      try {
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (error) {
        console.warn('Long task monitoring not supported:', error);
      }
    }
  }

  // Generate comprehensive performance report
  generatePerformanceReport(): {
    syncPerformance: ReturnType<typeof this.getSyncPerformanceStats>;
    reliability: ReliabilityMetrics;
    budgetCheck: ReturnType<typeof this.checkPerformanceBudgets>;
    networkInfo: any;
    bundleMetrics: {
      totalLoadTime: number;
      totalParseTime: number;
      cacheHitRate: number;
      largestBundle: { name: string; size: number; loadTime: number } | null;
    };
    jsPerformance: {
      longTaskCount: number;
      totalBlockingTime: number;
      averageTaskDuration: number;
    };
    timestamp: Date;
  } {
    const bundleMetrics = this.getBundleMetrics();
    const jsPerformance = this.getJavaScriptPerformanceMetrics();

    return {
      syncPerformance: this.getSyncPerformanceStats(),
      reliability: this.getReliabilityMetrics(),
      budgetCheck: this.checkPerformanceBudgets(),
      networkInfo: this.networkInfo ? {
        effectiveType: this.networkInfo.effectiveType,
        downlink: this.networkInfo.downlink,
        rtt: this.networkInfo.rtt,
      } : null,
      bundleMetrics,
      jsPerformance,
      timestamp: new Date(),
    };
  }

  private getBundleMetrics() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.includes('.js'));
    
    let totalLoadTime = 0;
    let totalParseTime = 0;
    let cacheHits = 0;
    let largestBundle: { name: string; size: number; loadTime: number } | null = null;

    jsResources.forEach(resource => {
      totalLoadTime += resource.duration;
      totalParseTime += resource.responseEnd - resource.responseStart;
      
      if (resource.transferSize === 0) {
        cacheHits++;
      }

      if (resource.transferSize && (!largestBundle || resource.transferSize > largestBundle.size)) {
        largestBundle = {
          name: this.getResourceName(resource.name),
          size: resource.transferSize,
          loadTime: resource.duration,
        };
      }
    });

    return {
      totalLoadTime,
      totalParseTime,
      cacheHitRate: jsResources.length > 0 ? cacheHits / jsResources.length : 0,
      largestBundle,
    };
  }

  private getJavaScriptPerformanceMetrics() {
    const longTasks = performance.getEntriesByType('longtask');
    
    let totalBlockingTime = 0;
    longTasks.forEach(task => {
      if (task.duration > 50) {
        totalBlockingTime += task.duration - 50; // Only count time over 50ms as blocking
      }
    });

    return {
      longTaskCount: longTasks.length,
      totalBlockingTime,
      averageTaskDuration: longTasks.length > 0 
        ? longTasks.reduce((sum, task) => sum + task.duration, 0) / longTasks.length 
        : 0,
    };
  }

  // Initialize all monitoring
  initialize(): void {
    this.monitorNetworkPerformance();
    this.monitorBundlePerformance();
    this.monitorBundlePerformanceEnhanced();
    this.monitorMemoryUsage();
    this.monitorWebVitals();
    this.monitorJavaScriptPerformance();

    // Generate periodic reports
    setInterval(() => {
      const report = this.generatePerformanceReport();
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Performance Report:', report);
      }
      
      // Send to analytics service if available
      if (report.budgetCheck.violations.length > 0) {
        errorTracker.reportError(
          'Performance budget violations detected',
          { violations: report.budgetCheck.violations },
          'medium'
        );
      }

      // Alert on poor JavaScript performance
      if (report.jsPerformance.totalBlockingTime > 300) {
        errorTracker.reportError(
          `High total blocking time: ${report.jsPerformance.totalBlockingTime}ms`,
          { jsPerformance: report.jsPerformance },
          'high'
        );
      }

      // Alert on poor bundle performance
      if (report.bundleMetrics.cacheHitRate < 0.5) {
        errorTracker.reportError(
          `Low bundle cache hit rate: ${Math.round(report.bundleMetrics.cacheHitRate * 100)}%`,
          { bundleMetrics: report.bundleMetrics },
          'medium'
        );
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const [service] = React.useState(() => PerformanceMonitoringService.getInstance());
  
  React.useEffect(() => {
    service.initialize();
    return () => service.destroy();
  }, [service]);

  const startSyncOperation = React.useCallback(
    (operation: SyncPerformanceMetrics['operation']) => {
      return service.startSyncOperation(operation);
    },
    [service]
  );

  const getPerformanceReport = React.useCallback(() => {
    return service.generatePerformanceReport();
  }, [service]);

  return {
    startSyncOperation,
    getPerformanceReport,
    getSyncStats: () => service.getSyncPerformanceStats(),
    getReliabilityMetrics: () => service.getReliabilityMetrics(),
  };
};

export const performanceMonitoringService = PerformanceMonitoringService.getInstance();

export default {
  PerformanceMonitoringService,
  performanceMonitoringService,
  usePerformanceMonitoring,
};