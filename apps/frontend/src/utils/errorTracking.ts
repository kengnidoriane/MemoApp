// Error tracking and monitoring utilities
import React from 'react';

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  buildVersion?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags?: Record<string, string>;
  context?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  url: string;
  sessionId: string;
  tags?: Record<string, string>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private sessionId: string;
  private userId?: string;
  private buildVersion?: string;
  private errorQueue: ErrorInfo[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.setupNetworkListeners();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.userId,
        buildVersion: this.buildVersion,
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.userId,
        buildVersion: this.buildVersion,
        severity: 'high',
        tags: { type: 'unhandled-promise' },
      });
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueues();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  setUser(userId: string): void {
    this.userId = userId;
  }

  setBuildVersion(version: string): void {
    this.buildVersion = version;
  }

  captureError(errorInfo: Partial<ErrorInfo>): void {
    const fullErrorInfo: ErrorInfo = {
      message: errorInfo.message || 'Unknown error',
      stack: errorInfo.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
      timestamp: errorInfo.timestamp || new Date(),
      url: errorInfo.url || window.location.href,
      userAgent: errorInfo.userAgent || navigator.userAgent,
      sessionId: errorInfo.sessionId || this.sessionId,
      userId: errorInfo.userId || this.userId,
      buildVersion: errorInfo.buildVersion || this.buildVersion,
      severity: errorInfo.severity || 'medium',
      tags: errorInfo.tags,
      context: errorInfo.context,
    };

    this.errorQueue.push(fullErrorInfo);

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushQueues();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', fullErrorInfo);
    }
  }

  capturePerformanceMetric(metric: Partial<PerformanceMetric>): void {
    const fullMetric: PerformanceMetric = {
      name: metric.name || 'unknown',
      value: metric.value || 0,
      timestamp: metric.timestamp || new Date(),
      url: metric.url || window.location.href,
      sessionId: metric.sessionId || this.sessionId,
      tags: metric.tags,
    };

    this.performanceQueue.push(fullMetric);

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushQueues();
    }
  }

  private async flushQueues(): Promise<void> {
    if (!this.isOnline) return;

    // Send errors
    if (this.errorQueue.length > 0) {
      try {
        await this.sendErrors([...this.errorQueue]);
        this.errorQueue = [];
      } catch (error) {
        console.warn('Failed to send error reports:', error);
      }
    }

    // Send performance metrics
    if (this.performanceQueue.length > 0) {
      try {
        await this.sendPerformanceMetrics([...this.performanceQueue]);
        this.performanceQueue = [];
      } catch (error) {
        console.warn('Failed to send performance metrics:', error);
      }
    }
  }

  private async sendErrors(errors: ErrorInfo[]): Promise<void> {
    // In a real implementation, this would send to your error tracking service
    // For now, we'll just log to console
    console.log('Sending errors to tracking service:', errors);
    
    // Example implementation:
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ errors }),
    // });
  }

  private async sendPerformanceMetrics(metrics: PerformanceMetric[]): Promise<void> {
    // In a real implementation, this would send to your analytics service
    console.log('Sending performance metrics:', metrics);
    
    // Example implementation:
    // await fetch('/api/metrics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ metrics }),
    // });
  }

  // React Error Boundary integration
  captureReactError(error: Error, errorInfo: { componentStack: string }): void {
    this.captureError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      severity: 'high',
      tags: { type: 'react-error' },
    });
  }

  // Manual error reporting
  reportError(
    message: string,
    context?: Record<string, any>,
    severity: ErrorInfo['severity'] = 'medium'
  ): void {
    this.captureError({
      message,
      context,
      severity,
      tags: { type: 'manual' },
    });
  }

  // Performance monitoring
  startPerformanceTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.capturePerformanceMetric({
        name,
        value: duration,
        tags: { type: 'timer' },
      });
    };
  }

  // Web Vitals integration
  reportWebVital(name: string, value: number, id?: string): void {
    this.capturePerformanceMetric({
      name: `web-vital-${name}`,
      value,
      tags: { 
        type: 'web-vital',
        id: id || 'unknown',
      },
    });
  }

  // Network error tracking
  reportNetworkError(
    url: string,
    status: number,
    statusText: string,
    duration?: number
  ): void {
    this.captureError({
      message: `Network Error: ${status} ${statusText}`,
      severity: status >= 500 ? 'high' : 'medium',
      tags: { 
        type: 'network-error',
        status: status.toString(),
      },
      context: {
        url: url.replace(/\/\d+/g, '/:id'), // Normalize URLs for better grouping
        status,
        statusText,
        duration,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
      },
    });
  }

  private getConnectionType(): string {
    // @ts-ignore - Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  // Performance regression detection
  reportPerformanceRegression(
    metric: string,
    currentValue: number,
    baselineValue: number,
    threshold: number = 0.2 // 20% regression threshold
  ): void {
    const regressionPercent = (currentValue - baselineValue) / baselineValue;
    
    if (regressionPercent > threshold) {
      this.captureError({
        message: `Performance regression detected in ${metric}`,
        severity: regressionPercent > 0.5 ? 'high' : 'medium',
        tags: {
          type: 'performance-regression',
          metric,
        },
        context: {
          currentValue,
          baselineValue,
          regressionPercent: Math.round(regressionPercent * 100),
          threshold: Math.round(threshold * 100),
        },
      });
    }
  }

  // Bundle performance tracking
  reportBundlePerformance(bundleInfo: {
    name: string;
    size: number;
    loadTime: number;
    parseTime: number;
    cached: boolean;
  }): void {
    this.capturePerformanceMetric({
      name: 'bundle-performance',
      value: bundleInfo.loadTime,
      tags: {
        type: 'bundle-metrics',
        bundleName: bundleInfo.name,
        cached: bundleInfo.cached.toString(),
        size: bundleInfo.size.toString(),
      },
    });

    // Report slow bundles
    if (bundleInfo.loadTime > 2000 && !bundleInfo.cached) {
      this.reportError(
        `Slow bundle loading: ${bundleInfo.name}`,
        bundleInfo,
        'medium'
      );
    }

    // Report large bundles
    if (bundleInfo.size > 500 * 1024) { // 500KB
      this.reportError(
        `Large bundle detected: ${bundleInfo.name}`,
        bundleInfo,
        'low'
      );
    }
  }

  // Get session info for debugging
  getSessionInfo(): {
    sessionId: string;
    userId?: string;
    buildVersion?: string;
    errorCount: number;
    metricCount: number;
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      buildVersion: this.buildVersion,
      errorCount: this.errorQueue.length,
      metricCount: this.performanceQueue.length,
    };
  }
}

// React Error Boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorTracker.getInstance().captureReactError(error, {
      componentStack: errorInfo.componentStack || '',
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent && this.state.error) {
        return React.createElement(FallbackComponent, { error: this.state.error });
      }
      return React.createElement(
        'div',
        { className: 'error-boundary' },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('p', null, "We've been notified of this error and are working to fix it.")
      );
    }

    return this.props.children;
  }
}

// Performance monitoring hook
export const usePerformanceTracking = (componentName: string) => {
  const errorTracker = ErrorTracker.getInstance();
  
  React.useEffect(() => {
    const endTimer = errorTracker.startPerformanceTimer(`component-mount-${componentName}`);
    return endTimer;
  }, [componentName, errorTracker]);

  const trackUserAction = React.useCallback((actionName: string, context?: Record<string, any>) => {
    errorTracker.capturePerformanceMetric({
      name: `user-action-${actionName}`,
      value: Date.now(),
      tags: { 
        type: 'user-action',
        component: componentName,
      },
    });
  }, [componentName, errorTracker]);

  const reportError = React.useCallback((error: string | Error, context?: Record<string, any>) => {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' ? error.stack : undefined;
    
    errorTracker.captureError({
      message,
      stack,
      context: {
        ...context,
        component: componentName,
      },
      tags: { component: componentName },
    });
  }, [componentName, errorTracker]);

  return {
    trackUserAction,
    reportError,
  };
};

// Singleton instance
export const errorTracker = ErrorTracker.getInstance();

// Utility functions
export const withErrorTracking = <T extends (...args: any[]) => any>(
  fn: T,
  context?: Record<string, any>
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorTracker.captureError({
            message: error.message || 'Async function error',
            stack: error.stack,
            context,
            severity: 'medium',
          });
          throw error;
        });
      }
      
      return result;
    } catch (error: any) {
      errorTracker.captureError({
        message: error.message || 'Function execution error',
        stack: error.stack,
        context,
        severity: 'medium',
      });
      throw error;
    }
  }) as T;
};

export default {
  ErrorTracker,
  ErrorBoundary,
  errorTracker,
  usePerformanceTracking,
  withErrorTracking,
};