import { useState, useEffect, useCallback } from 'react';
import { useWebVitals } from '../services/webVitalsService';
import { usePerformanceMonitoring } from '../services/performanceMonitoringService';
import { usePerformanceOptimization } from '../services/performanceOptimizationService';

export interface PerformanceData {
  webVitals: {
    metrics: Record<string, any>;
    performanceScore: number;
  };
  syncPerformance: {
    successRate: number;
    averageDuration: number;
    totalOperations: number;
  };
  cachePerformance: {
    hitRate: number;
    size: number;
    hitCount: number;
    missCount: number;
  };
  budgetViolations: Array<{
    metric: string;
    actual: number;
    budget: number;
  }>;
  recommendations: string[];
  networkInfo?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  timestamp: Date;
}

export const usePerformance = () => {
  const { metrics, performanceScore, generateReport: generateWebVitalsReport } = useWebVitals();
  const { getPerformanceReport: getMonitoringReport, getSyncStats } = usePerformanceMonitoring();
  const { getPerformanceReport: getOptimizationReport, checkBudgets } = usePerformanceOptimization();
  
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFullReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const webVitalsReport = generateWebVitalsReport();
      const monitoringReport = getMonitoringReport();
      const optimizationReport = getOptimizationReport();
      const budgetViolations = checkBudgets();
      const syncStats = getSyncStats();

      const data: PerformanceData = {
        webVitals: {
          metrics,
          performanceScore,
        },
        syncPerformance: {
          successRate: syncStats.successRate,
          averageDuration: syncStats.averageDuration,
          totalOperations: syncStats.totalOperations,
        },
        cachePerformance: {
          hitRate: optimizationReport.cacheStats?.hitRate || 0,
          size: optimizationReport.cacheStats?.size || 0,
          hitCount: optimizationReport.cacheStats?.hitCount || 0,
          missCount: optimizationReport.cacheStats?.missCount || 0,
        },
        budgetViolations,
        recommendations: [
          ...webVitalsReport.recommendations,
          ...optimizationReport.recommendations,
        ],
        networkInfo: monitoringReport.networkInfo,
        timestamp: new Date(),
      };

      setPerformanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate performance report');
    } finally {
      setIsLoading(false);
    }
  }, [
    generateWebVitalsReport,
    getMonitoringReport,
    getOptimizationReport,
    checkBudgets,
    getSyncStats,
    metrics,
    performanceScore,
  ]);

  // Auto-generate report on mount and when metrics change
  useEffect(() => {
    generateFullReport();
  }, [generateFullReport]);

  const getPerformanceScore = useCallback(() => {
    if (!performanceData) return 0;
    
    // Calculate weighted score based on different metrics
    const weights = {
      webVitals: 0.4,
      syncPerformance: 0.3,
      cachePerformance: 0.2,
      budgetCompliance: 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Web Vitals score
    totalScore += performanceData.webVitals.performanceScore * weights.webVitals;
    totalWeight += weights.webVitals;

    // Sync performance score
    const syncScore = Math.min(100, performanceData.syncPerformance.successRate * 100);
    totalScore += syncScore * weights.syncPerformance;
    totalWeight += weights.syncPerformance;

    // Cache performance score
    const cacheScore = Math.min(100, performanceData.cachePerformance.hitRate * 100);
    totalScore += cacheScore * weights.cachePerformance;
    totalWeight += weights.cachePerformance;

    // Budget compliance score
    const budgetScore = performanceData.budgetViolations.length === 0 ? 100 : 0;
    totalScore += budgetScore * weights.budgetCompliance;
    totalWeight += weights.budgetCompliance;

    return Math.round(totalScore / totalWeight);
  }, [performanceData]);

  const getHealthStatus = useCallback(() => {
    const score = getPerformanceScore();
    
    if (score >= 90) return { status: 'excellent', color: 'success' };
    if (score >= 70) return { status: 'good', color: 'success' };
    if (score >= 50) return { status: 'needs-improvement', color: 'warning' };
    return { status: 'poor', color: 'error' };
  }, [getPerformanceScore]);

  const getCriticalIssues = useCallback(() => {
    if (!performanceData) return [];

    const issues: Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low' }> = [];

    // Check Web Vitals
    Object.entries(performanceData.webVitals.metrics).forEach(([key, metric]: [string, any]) => {
      if (metric?.rating === 'poor') {
        issues.push({
          type: 'web-vital',
          message: `Poor ${key}: ${metric.value}${key === 'CLS' ? '' : 'ms'}`,
          severity: 'high',
        });
      }
    });

    // Check sync performance
    if (performanceData.syncPerformance.successRate < 0.9) {
      issues.push({
        type: 'sync',
        message: `Low sync success rate: ${Math.round(performanceData.syncPerformance.successRate * 100)}%`,
        severity: 'high',
      });
    }

    // Check cache performance
    if (performanceData.cachePerformance.hitRate < 0.6) {
      issues.push({
        type: 'cache',
        message: `Low cache hit rate: ${Math.round(performanceData.cachePerformance.hitRate * 100)}%`,
        severity: 'medium',
      });
    }

    // Check budget violations
    performanceData.budgetViolations.forEach(violation => {
      issues.push({
        type: 'budget',
        message: `Performance budget exceeded for ${violation.metric}`,
        severity: 'medium',
      });
    });

    return issues;
  }, [performanceData]);

  return {
    performanceData,
    isLoading,
    error,
    generateFullReport,
    getPerformanceScore,
    getHealthStatus,
    getCriticalIssues,
    refresh: generateFullReport,
  };
};