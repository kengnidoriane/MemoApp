// Web Vitals monitoring service for Core Web Vitals tracking
import React from 'react';
import { errorTracker } from '../utils/errorTracking';

export interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

class WebVitalsService {
  private static instance: WebVitalsService;
  private metrics: Map<string, WebVitalMetric> = new Map();
  private thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    FID: { good: 100, poor: 300 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  private constructor() {
    this.initializeWebVitals();
  }

  static getInstance(): WebVitalsService {
    if (!WebVitalsService.instance) {
      WebVitalsService.instance = new WebVitalsService();
    }
    return WebVitalsService.instance;
  }

  private async initializeWebVitals(): Promise<void> {
    try {
      // Dynamic import to avoid bundling web-vitals if not needed
      const { onCLS, onFCP, onFID, onLCP, onTTFB, onINP } = await import('web-vitals');

      // Core Web Vitals
      onCLS(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onFID(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
      
      // Interaction to Next Paint (newer metric)
      if (onINP) {
        onINP(this.handleMetric.bind(this));
      }
    } catch (error) {
      console.warn('Web Vitals library not available:', error);
      // Fallback to manual performance monitoring
      this.initializeFallbackMetrics();
    }
  }

  private handleMetric(metric: any): void {
    const webVitalMetric: WebVitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
    };

    this.metrics.set(metric.name, webVitalMetric);

    // Report to error tracking service
    errorTracker.reportWebVital(metric.name, metric.value, metric.id);

    // Log poor performance
    if (webVitalMetric.rating === 'poor') {
      errorTracker.reportError(
        `Poor Web Vital detected: ${metric.name} = ${metric.value}`,
        {
          metric: webVitalMetric,
          threshold: this.thresholds[metric.name as keyof typeof this.thresholds],
        },
        'medium'
      );
    }

    // Trigger custom event for other parts of the app
    window.dispatchEvent(new CustomEvent('webvital', { detail: webVitalMetric }));
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[name as keyof typeof this.thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private initializeFallbackMetrics(): void {
    // Fallback performance monitoring using Performance API
    if ('PerformanceObserver' in window) {
      // Monitor paint metrics
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.handleMetric({
              name: 'FCP',
              value: entry.startTime,
              delta: entry.startTime,
              id: 'fallback-fcp',
              navigationType: 'navigate',
            });
          }
        }
      });

      try {
        paintObserver.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('Paint observer not supported:', error);
      }

      // Monitor layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        if (clsValue > 0) {
          this.handleMetric({
            name: 'CLS',
            value: clsValue,
            delta: clsValue,
            id: 'fallback-cls',
            navigationType: 'navigate',
          });
        }
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }
    }
  }

  getMetrics(): Map<string, WebVitalMetric> {
    return new Map(this.metrics);
  }

  getMetric(name: string): WebVitalMetric | undefined {
    return this.metrics.get(name);
  }

  getPerformanceScore(): {
    score: number;
    breakdown: Record<string, { value: number; rating: string; weight: number }>;
  } {
    const weights = {
      LCP: 0.25,
      FID: 0.25,
      CLS: 0.25,
      FCP: 0.15,
      TTFB: 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;
    const breakdown: Record<string, { value: number; rating: string; weight: number }> = {};

    for (const [name, weight] of Object.entries(weights)) {
      const metric = this.metrics.get(name);
      if (metric) {
        let score = 0;
        switch (metric.rating) {
          case 'good':
            score = 100;
            break;
          case 'needs-improvement':
            score = 50;
            break;
          case 'poor':
            score = 0;
            break;
        }

        totalScore += score * weight;
        totalWeight += weight;
        breakdown[name] = {
          value: metric.value,
          rating: metric.rating,
          weight,
        };
      }
    }

    return {
      score: totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0,
      breakdown,
    };
  }

  // Monitor specific user interactions
  monitorUserInteraction(element: HTMLElement, actionName: string): void {
    const startTime = performance.now();

    const handleInteraction = () => {
      const duration = performance.now() - startTime;
      
      errorTracker.capturePerformanceMetric({
        name: `user-interaction-${actionName}`,
        value: duration,
        tags: {
          type: 'user-interaction',
          element: element.tagName.toLowerCase(),
          action: actionName,
        },
      });

      // Warn about slow interactions
      if (duration > 100) {
        errorTracker.reportError(
          `Slow user interaction detected: ${actionName} took ${duration}ms`,
          {
            element: element.tagName,
            action: actionName,
            duration,
          },
          'low'
        );
      }

      element.removeEventListener('click', handleInteraction);
    };

    element.addEventListener('click', handleInteraction, { once: true });
  }

  // Generate performance report
  generateReport(): {
    webVitals: Record<string, WebVitalMetric>;
    performanceScore: ReturnType<typeof this.getPerformanceScore>;
    recommendations: string[];
    timestamp: Date;
  } {
    const webVitals = Object.fromEntries(this.metrics);
    const performanceScore = this.getPerformanceScore();
    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    for (const [name, metric] of this.metrics) {
      if (metric.rating === 'poor') {
        switch (name) {
          case 'LCP':
            recommendations.push('Optimize images and reduce server response times to improve Largest Contentful Paint');
            break;
          case 'FID':
            recommendations.push('Reduce JavaScript execution time and optimize event handlers for better First Input Delay');
            break;
          case 'CLS':
            recommendations.push('Set explicit dimensions for images and avoid inserting content above existing content');
            break;
          case 'FCP':
            recommendations.push('Optimize critical rendering path and reduce render-blocking resources');
            break;
          case 'TTFB':
            recommendations.push('Optimize server response times and consider using a CDN');
            break;
        }
      }
    }

    return {
      webVitals,
      performanceScore,
      recommendations,
      timestamp: new Date(),
    };
  }
}

// React hook for Web Vitals monitoring
export const useWebVitals = () => {
  const [service] = React.useState(() => WebVitalsService.getInstance());
  const [metrics, setMetrics] = React.useState<Map<string, WebVitalMetric>>(new Map());
  const [performanceScore, setPerformanceScore] = React.useState(0);

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(service.getMetrics());
      setPerformanceScore(service.getPerformanceScore().score);
    };

    // Listen for web vital updates
    const handleWebVital = () => updateMetrics();
    window.addEventListener('webvital', handleWebVital);

    // Initial update
    updateMetrics();

    return () => {
      window.removeEventListener('webvital', handleWebVital);
    };
  }, [service]);

  const generateReport = React.useCallback(() => {
    return service.generateReport();
  }, [service]);

  const monitorInteraction = React.useCallback((element: HTMLElement, actionName: string) => {
    service.monitorUserInteraction(element, actionName);
  }, [service]);

  return {
    metrics: Object.fromEntries(metrics),
    performanceScore,
    generateReport,
    monitorInteraction,
  };
};

export const webVitalsService = WebVitalsService.getInstance();

export default {
  WebVitalsService,
  webVitalsService,
  useWebVitals,
};