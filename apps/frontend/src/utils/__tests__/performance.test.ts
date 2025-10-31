import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static observers: PerformanceObserver[] = [];

  static startTiming(label: string): () => number {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  static recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);
  }

  static getMetrics(label: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      count: values.length,
      average: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }

  static observeWebVitals(): void {
    // Observe Core Web Vitals
    if (typeof PerformanceObserver !== 'undefined') {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('LCP', entry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('FID', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordMetric('CLS', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    }
  }

  static disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  static measureAsyncOperation<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const endTiming = this.startTiming(label);
    return operation().finally(() => {
      endTiming();
    });
  }

  static measureSyncOperation<T>(
    label: string,
    operation: () => T
  ): T {
    const endTiming = this.startTiming(label);
    try {
      return operation();
    } finally {
      endTiming();
    }
  }

  static checkPerformanceBudget(budgets: Record<string, number>): {
    passed: boolean;
    violations: Array<{ metric: string; actual: number; budget: number }>;
  } {
    const violations: Array<{ metric: string; actual: number; budget: number }> = [];

    for (const [metric, budget] of Object.entries(budgets)) {
      const stats = this.getMetrics(metric);
      if (stats.p95 > budget) {
        violations.push({
          metric,
          actual: stats.p95,
          budget,
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}

// Bundle size analyzer
export class BundleAnalyzer {
  static analyzeBundleSize(bundleStats: any): {
    totalSize: number;
    gzippedSize: number;
    chunks: Array<{ name: string; size: number; modules: number }>;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const chunks = bundleStats.chunks || [];
    
    let totalSize = 0;
    const chunkInfo = chunks.map((chunk: any) => {
      const size = chunk.size || 0;
      totalSize += size;
      
      // Check for large chunks
      if (size > 500 * 1024) { // 500KB
        warnings.push(`Large chunk detected: ${chunk.name} (${(size / 1024).toFixed(1)}KB)`);
      }
      
      return {
        name: chunk.name,
        size,
        modules: chunk.modules?.length || 0,
      };
    });

    // Estimate gzipped size (roughly 30% of original)
    const gzippedSize = Math.round(totalSize * 0.3);

    // Check total bundle size
    if (totalSize > 2 * 1024 * 1024) { // 2MB
      warnings.push(`Large total bundle size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
    }

    return {
      totalSize,
      gzippedSize,
      chunks: chunkInfo,
      warnings,
    };
  }

  static findDuplicateModules(bundleStats: any): Array<{
    module: string;
    chunks: string[];
    totalSize: number;
  }> {
    const moduleMap = new Map<string, { chunks: string[]; size: number }>();
    
    for (const chunk of bundleStats.chunks || []) {
      for (const module of chunk.modules || []) {
        const existing = moduleMap.get(module.name);
        if (existing) {
          existing.chunks.push(chunk.name);
          existing.size += module.size || 0;
        } else {
          moduleMap.set(module.name, {
            chunks: [chunk.name],
            size: module.size || 0,
          });
        }
      }
    }

    return Array.from(moduleMap.entries())
      .filter(([_, info]) => info.chunks.length > 1)
      .map(([module, info]) => ({
        module,
        chunks: info.chunks,
        totalSize: info.size,
      }));
  }
}

// Memory usage monitor
export class MemoryMonitor {
  private static measurements: Array<{
    timestamp: number;
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }> = [];

  static recordMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.measurements.push({
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
    }
  }

  static getMemoryTrend(windowMs: number = 60000): {
    trend: 'increasing' | 'decreasing' | 'stable';
    averageUsage: number;
    peakUsage: number;
    memoryLeakSuspected: boolean;
  } {
    const now = Date.now();
    const recentMeasurements = this.measurements.filter(
      m => now - m.timestamp <= windowMs
    );

    if (recentMeasurements.length < 2) {
      return {
        trend: 'stable',
        averageUsage: 0,
        peakUsage: 0,
        memoryLeakSuspected: false,
      };
    }

    const usages = recentMeasurements.map(m => m.usedJSHeapSize);
    const averageUsage = usages.reduce((sum, usage) => sum + usage, 0) / usages.length;
    const peakUsage = Math.max(...usages);

    // Simple trend analysis
    const firstHalf = usages.slice(0, Math.floor(usages.length / 2));
    const secondHalf = usages.slice(Math.floor(usages.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, usage) => sum + usage, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, usage) => sum + usage, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (changePercent > 10) {
      trend = 'increasing';
    } else if (changePercent < -10) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    // Memory leak detection (simplified)
    const memoryLeakSuspected = trend === 'increasing' && changePercent > 50;

    return {
      trend,
      averageUsage,
      peakUsage,
      memoryLeakSuspected,
    };
  }

  static clearMeasurements(): void {
    this.measurements = [];
  }
}

describe('Performance Monitoring', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMetrics();
    MemoryMonitor.clearMeasurements();
  });

  afterEach(() => {
    PerformanceMonitor.disconnect();
  });

  describe('PerformanceMonitor', () => {
    it('should record and calculate timing metrics', () => {
      PerformanceMonitor.recordMetric('test-operation', 100);
      PerformanceMonitor.recordMetric('test-operation', 200);
      PerformanceMonitor.recordMetric('test-operation', 150);

      const metrics = PerformanceMonitor.getMetrics('test-operation');

      expect(metrics.count).toBe(3);
      expect(metrics.average).toBe(150);
      expect(metrics.min).toBe(100);
      expect(metrics.max).toBe(200);
      expect(metrics.p95).toBe(200);
    });

    it('should measure sync operations', () => {
      const result = PerformanceMonitor.measureSyncOperation('sync-test', () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500);
      
      const metrics = PerformanceMonitor.getMetrics('sync-test');
      expect(metrics.count).toBe(1);
      expect(metrics.average).toBeGreaterThan(0);
    });

    it('should measure async operations', async () => {
      const result = await PerformanceMonitor.measureAsyncOperation('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'completed';
      });

      expect(result).toBe('completed');
      
      const metrics = PerformanceMonitor.getMetrics('async-test');
      expect(metrics.count).toBe(1);
      expect(metrics.average).toBeGreaterThanOrEqual(10);
    });

    it('should check performance budgets', () => {
      PerformanceMonitor.recordMetric('api-call', 50);
      PerformanceMonitor.recordMetric('api-call', 100);
      PerformanceMonitor.recordMetric('api-call', 200);

      const budgetCheck = PerformanceMonitor.checkPerformanceBudget({
        'api-call': 150,
      });

      expect(budgetCheck.passed).toBe(false);
      expect(budgetCheck.violations).toHaveLength(1);
      expect(budgetCheck.violations[0].metric).toBe('api-call');
      expect(budgetCheck.violations[0].actual).toBe(200);
      expect(budgetCheck.violations[0].budget).toBe(150);
    });

    it('should pass performance budget when within limits', () => {
      PerformanceMonitor.recordMetric('fast-operation', 10);
      PerformanceMonitor.recordMetric('fast-operation', 20);
      PerformanceMonitor.recordMetric('fast-operation', 15);

      const budgetCheck = PerformanceMonitor.checkPerformanceBudget({
        'fast-operation': 50,
      });

      expect(budgetCheck.passed).toBe(true);
      expect(budgetCheck.violations).toHaveLength(0);
    });
  });

  describe('BundleAnalyzer', () => {
    it('should analyze bundle size and detect issues', () => {
      const mockBundleStats = {
        chunks: [
          {
            name: 'main',
            size: 300 * 1024, // 300KB
            modules: [
              { name: 'react', size: 50 * 1024 },
              { name: 'app', size: 250 * 1024 },
            ],
          },
          {
            name: 'vendor',
            size: 600 * 1024, // 600KB - should trigger warning
            modules: [
              { name: 'lodash', size: 300 * 1024 },
              { name: 'moment', size: 300 * 1024 },
            ],
          },
        ],
      };

      const analysis = BundleAnalyzer.analyzeBundleSize(mockBundleStats);

      expect(analysis.totalSize).toBe(900 * 1024);
      expect(analysis.gzippedSize).toBe(Math.round(900 * 1024 * 0.3));
      expect(analysis.chunks).toHaveLength(2);
      expect(analysis.warnings).toContain('Large chunk detected: vendor (600.0KB)');
    });

    it('should find duplicate modules', () => {
      const mockBundleStats = {
        chunks: [
          {
            name: 'main',
            modules: [
              { name: 'react', size: 50 * 1024 },
              { name: 'lodash', size: 100 * 1024 },
            ],
          },
          {
            name: 'vendor',
            modules: [
              { name: 'lodash', size: 100 * 1024 }, // Duplicate
              { name: 'moment', size: 200 * 1024 },
            ],
          },
        ],
      };

      const duplicates = BundleAnalyzer.findDuplicateModules(mockBundleStats);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].module).toBe('lodash');
      expect(duplicates[0].chunks).toEqual(['main', 'vendor']);
      expect(duplicates[0].totalSize).toBe(200 * 1024);
    });
  });

  describe('MemoryMonitor', () => {
    it('should detect memory trends', () => {
      // Mock performance.memory
      const originalMemory = (performance as any).memory;
      (performance as any).memory = {
        usedJSHeapSize: 10 * 1024 * 1024,
        totalJSHeapSize: 20 * 1024 * 1024,
        jsHeapSizeLimit: 100 * 1024 * 1024,
      };

      // Record increasing memory usage
      MemoryMonitor.recordMemoryUsage();
      
      (performance as any).memory.usedJSHeapSize = 15 * 1024 * 1024;
      MemoryMonitor.recordMemoryUsage();
      
      (performance as any).memory.usedJSHeapSize = 20 * 1024 * 1024;
      MemoryMonitor.recordMemoryUsage();

      const trend = MemoryMonitor.getMemoryTrend();

      expect(trend.trend).toBe('increasing');
      expect(trend.averageUsage).toBeGreaterThan(10 * 1024 * 1024);
      expect(trend.peakUsage).toBe(20 * 1024 * 1024);

      // Restore original memory
      (performance as any).memory = originalMemory;
    });

    it('should detect potential memory leaks', () => {
      // Mock performance.memory
      const originalMemory = (performance as any).memory;
      (performance as any).memory = {
        usedJSHeapSize: 10 * 1024 * 1024,
        totalJSHeapSize: 20 * 1024 * 1024,
        jsHeapSizeLimit: 100 * 1024 * 1024,
      };

      // Record dramatically increasing memory usage
      MemoryMonitor.recordMemoryUsage();
      
      (performance as any).memory.usedJSHeapSize = 50 * 1024 * 1024;
      MemoryMonitor.recordMemoryUsage();

      const trend = MemoryMonitor.getMemoryTrend();

      expect(trend.memoryLeakSuspected).toBe(true);

      // Restore original memory
      (performance as any).memory = originalMemory;
    });
  });

  describe('Integration Tests', () => {
    it('should monitor complete operation lifecycle', async () => {
      // Start monitoring
      PerformanceMonitor.observeWebVitals();

      // Simulate API call with performance monitoring
      const apiResult = await PerformanceMonitor.measureAsyncOperation('api-fetch', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { data: 'test' };
      });

      // Simulate component render with performance monitoring
      const renderResult = PerformanceMonitor.measureSyncOperation('component-render', () => {
        // Simulate DOM operations
        return 'rendered';
      });

      expect(apiResult.data).toBe('test');
      expect(renderResult).toBe('rendered');

      // Check metrics were recorded
      const apiMetrics = PerformanceMonitor.getMetrics('api-fetch');
      const renderMetrics = PerformanceMonitor.getMetrics('component-render');

      expect(apiMetrics.count).toBe(1);
      expect(renderMetrics.count).toBe(1);
      expect(apiMetrics.average).toBeGreaterThanOrEqual(50);
    });

    it('should detect performance regressions', () => {
      // Record baseline performance
      for (let i = 0; i < 10; i++) {
        PerformanceMonitor.recordMetric('baseline-operation', 100 + Math.random() * 20);
      }

      // Record regressed performance
      for (let i = 0; i < 5; i++) {
        PerformanceMonitor.recordMetric('baseline-operation', 200 + Math.random() * 50);
      }

      const metrics = PerformanceMonitor.getMetrics('baseline-operation');
      
      // Should detect that p95 is significantly higher than baseline
      expect(metrics.p95).toBeGreaterThan(150);
      
      const budgetCheck = PerformanceMonitor.checkPerformanceBudget({
        'baseline-operation': 150,
      });
      
      expect(budgetCheck.passed).toBe(false);
    });

    it('should monitor cache performance', () => {
      // Simulate cache operations
      PerformanceMonitor.recordMetric('cache-hit', 5);
      PerformanceMonitor.recordMetric('cache-hit', 3);
      PerformanceMonitor.recordMetric('cache-miss', 150);
      PerformanceMonitor.recordMetric('cache-miss', 200);

      const hitMetrics = PerformanceMonitor.getMetrics('cache-hit');
      const missMetrics = PerformanceMonitor.getMetrics('cache-miss');

      expect(hitMetrics.average).toBeLessThan(10);
      expect(missMetrics.average).toBeGreaterThan(100);

      // Check cache performance budget
      const budgetCheck = PerformanceMonitor.checkPerformanceBudget({
        'cache-hit': 10,
        'cache-miss': 300,
      });

      expect(budgetCheck.passed).toBe(true);
    });

    it('should monitor bundle loading performance', () => {
      // Simulate bundle loading metrics
      PerformanceMonitor.recordMetric('bundle-load', 800);
      PerformanceMonitor.recordMetric('bundle-load', 1200);
      PerformanceMonitor.recordMetric('bundle-parse', 200);
      PerformanceMonitor.recordMetric('bundle-parse', 300);

      const loadMetrics = PerformanceMonitor.getMetrics('bundle-load');
      const parseMetrics = PerformanceMonitor.getMetrics('bundle-parse');

      expect(loadMetrics.count).toBe(2);
      expect(parseMetrics.count).toBe(2);

      // Check bundle performance budget
      const budgetCheck = PerformanceMonitor.checkPerformanceBudget({
        'bundle-load': 2000,
        'bundle-parse': 500,
      });

      expect(budgetCheck.passed).toBe(true);
    });

    it('should monitor sync operation performance', async () => {
      // Simulate sync operations with different outcomes
      await PerformanceMonitor.measureAsyncOperation('sync-upload', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      });

      await PerformanceMonitor.measureAsyncOperation('sync-download', async () => {
        await new Promise(resolve => setTimeout(resolve, 80));
        return { success: true };
      });

      const uploadMetrics = PerformanceMonitor.getMetrics('sync-upload');
      const downloadMetrics = PerformanceMonitor.getMetrics('sync-download');

      expect(uploadMetrics.count).toBe(1);
      expect(downloadMetrics.count).toBe(1);
      expect(uploadMetrics.average).toBeGreaterThanOrEqual(100);
      expect(downloadMetrics.average).toBeGreaterThanOrEqual(80);

      // Check sync performance budget
      const budgetCheck = PerformanceMonitor.checkPerformanceBudget({
        'sync-upload': 200,
        'sync-download': 150,
      });

      expect(budgetCheck.passed).toBe(true);
    });

    it('should detect JavaScript performance issues', () => {
      // Simulate long tasks
      PerformanceMonitor.recordMetric('long-task', 120);
      PerformanceMonitor.recordMetric('long-task', 80);
      PerformanceMonitor.recordMetric('main-thread-blocking', 250);

      const longTaskMetrics = PerformanceMonitor.getMetrics('long-task');
      const blockingMetrics = PerformanceMonitor.getMetrics('main-thread-blocking');

      expect(longTaskMetrics.count).toBe(2);
      expect(blockingMetrics.count).toBe(1);

      // Check JavaScript performance budget
      const budgetCheck = PerformanceMonitor.checkPerformanceBudget({
        'long-task': 100,
        'main-thread-blocking': 200,
      });

      expect(budgetCheck.passed).toBe(false);
      expect(budgetCheck.violations).toHaveLength(2);
    });

    it('should provide comprehensive performance report', () => {
      // Record various metrics
      PerformanceMonitor.recordMetric('api-response', 150);
      PerformanceMonitor.recordMetric('component-render', 25);
      PerformanceMonitor.recordMetric('cache-hit', 5);
      PerformanceMonitor.recordMetric('bundle-load', 800);

      // Generate comprehensive report
      const report = {
        apiPerformance: PerformanceMonitor.getMetrics('api-response'),
        renderPerformance: PerformanceMonitor.getMetrics('component-render'),
        cachePerformance: PerformanceMonitor.getMetrics('cache-hit'),
        bundlePerformance: PerformanceMonitor.getMetrics('bundle-load'),
        budgetCheck: PerformanceMonitor.checkPerformanceBudget({
          'api-response': 200,
          'component-render': 50,
          'cache-hit': 10,
          'bundle-load': 1000,
        }),
      };

      expect(report.budgetCheck.passed).toBe(true);
      expect(report.apiPerformance.average).toBe(150);
      expect(report.renderPerformance.average).toBe(25);
      expect(report.cachePerformance.average).toBe(5);
      expect(report.bundlePerformance.average).toBe(800);
    });
  });
});