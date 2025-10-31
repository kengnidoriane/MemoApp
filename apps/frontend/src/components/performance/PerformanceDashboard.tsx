import React, { useState, useEffect } from 'react';
import { useWebVitals } from '../../services/webVitalsService';
import { usePerformanceMonitoring } from '../../services/performanceMonitoringService';
import { usePerformanceOptimization } from '../../services/performanceOptimizationService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MetricCardProps {
    title: string;
    value: number | string;
    unit?: string;
    rating?: 'good' | 'needs-improvement' | 'poor';
    description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, rating, description }) => {
    const getRatingColor = (rating?: string) => {
        switch (rating) {
            case 'good': return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
            case 'needs-improvement': return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
            case 'poor': return 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
                {rating && (
                    <Badge className={getRatingColor(rating)}>
                        {rating.replace('-', ' ')}
                    </Badge>
                )}
            </div>
            <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof value === 'number' ? value.toFixed(0) : value}
                </span>
                {unit && <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
            </div>
            {description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
            )}
        </Card>
    );
};

interface PerformanceScoreProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
}

const PerformanceScore: React.FC<PerformanceScoreProps> = ({ score, size = 'md' }) => {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-success-600';
        if (score >= 50) return 'text-warning-600';
        return 'text-error-600';
    };

    const getScoreRing = (score: number) => {
        if (score >= 90) return 'stroke-success-600';
        if (score >= 50) return 'stroke-warning-600';
        return 'stroke-error-600';
    };

    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
    };

    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative">
            <svg className={`${sizeClasses[size]} transform -rotate-90`} viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className={getScoreRing(score)}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`font-bold ${textSizeClasses[size]} ${getScoreColor(score)}`}>
                    {score}
                </span>
            </div>
        </div>
    );
};

interface RecommendationListProps {
    recommendations: string[];
}

const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => {
    if (recommendations.length === 0) {
        return (
            <Card className="p-4">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Great! No performance issues detected.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Recommendations
            </h3>
            <ul className="space-y-3">
                {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-warning-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</span>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

export const PerformanceDashboard: React.FC = () => {
    const { metrics, performanceScore, generateReport } = useWebVitals();
    const { getPerformanceReport, getSyncStats } = usePerformanceMonitoring();
    const { getPerformanceReport: getOptimizationReport, checkBudgets } = usePerformanceOptimization();

    const [fullReport, setFullReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const generateFullReport = async () => {
        setIsLoading(true);
        try {
            const webVitalsReport = generateReport();
            const monitoringReport = getPerformanceReport();
            const optimizationReport = getOptimizationReport();
            const budgetViolations = checkBudgets();
            const syncStats = getSyncStats();

            setFullReport({
                webVitals: webVitalsReport,
                monitoring: monitoringReport,
                optimization: optimizationReport,
                budgetViolations,
                syncStats,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error('Failed to generate performance report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateFullReport();
    }, []);

    const webVitalMetrics = [
        { key: 'LCP', name: 'Largest Contentful Paint', unit: 'ms', description: 'Time to render the largest content element' },
        { key: 'FID', name: 'First Input Delay', unit: 'ms', description: 'Time from first user interaction to browser response' },
        { key: 'CLS', name: 'Cumulative Layout Shift', unit: '', description: 'Visual stability of the page' },
        { key: 'FCP', name: 'First Contentful Paint', unit: 'ms', description: 'Time to render the first content element' },
        { key: 'TTFB', name: 'Time to First Byte', unit: 'ms', description: 'Time to receive the first byte from the server' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Monitor and optimize your application's performance</p>
                </div>
                <Button
                    onClick={generateFullReport}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                >
                    {isLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                    <span>Refresh Report</span>
                </Button>
            </div>

            {/* Performance Score */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Overall Performance Score</h2>
                        <p className="text-gray-600 dark:text-gray-400">Based on Core Web Vitals and other performance metrics</p>
                    </div>
                    <PerformanceScore score={performanceScore} size="lg" />
                </div>
            </Card>

            {/* Web Vitals */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Core Web Vitals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {webVitalMetrics.map(({ key, name, unit, description }) => {
                        const metric = metrics[key];
                        return (
                            <MetricCard
                                key={key}
                                title={name}
                                value={metric?.value || 0}
                                unit={unit}
                                rating={metric?.rating}
                                description={description}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Sync Performance */}
            {fullReport?.syncStats && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sync Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Success Rate"
                            value={Math.round(fullReport.syncStats.successRate * 100)}
                            unit="%"
                            rating={fullReport.syncStats.successRate > 0.95 ? 'good' : fullReport.syncStats.successRate > 0.8 ? 'needs-improvement' : 'poor'}
                        />
                        <MetricCard
                            title="Average Duration"
                            value={fullReport.syncStats.averageDuration}
                            unit="ms"
                            rating={fullReport.syncStats.averageDuration < 1000 ? 'good' : fullReport.syncStats.averageDuration < 3000 ? 'needs-improvement' : 'poor'}
                        />
                        <MetricCard
                            title="Total Operations"
                            value={fullReport.syncStats.totalOperations}
                        />
                        <MetricCard
                            title="Average Data Size"
                            value={Math.round(fullReport.syncStats.averageDataSize / 1024)}
                            unit="KB"
                        />
                    </div>
                </div>
            )}

            {/* Cache Performance */}
            {fullReport?.optimization?.cacheStats && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cache Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <MetricCard
                            title="Hit Rate"
                            value={Math.round(fullReport.optimization.cacheStats.hitRate * 100)}
                            unit="%"
                            rating={fullReport.optimization.cacheStats.hitRate > 0.8 ? 'good' : fullReport.optimization.cacheStats.hitRate > 0.6 ? 'needs-improvement' : 'poor'}
                        />
                        <MetricCard
                            title="Cache Size"
                            value={fullReport.optimization.cacheStats.size}
                            description={`Max: ${fullReport.optimization.cacheStats.maxSize}`}
                        />
                        <MetricCard
                            title="Hit Count"
                            value={fullReport.optimization.cacheStats.hitCount || 0}
                        />
                        <MetricCard
                            title="Miss Count"
                            value={fullReport.optimization.cacheStats.missCount || 0}
                        />
                    </div>
                    
                    {/* Cache Performance Breakdown */}
                    {fullReport.optimization.cacheStats.performanceBreakdown && (
                        <Card className="p-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Cache Performance Breakdown</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Memory Cache</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Avg: {fullReport.optimization.cacheStats.performanceBreakdown.memoryHitTime.toFixed(1)}ms
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        Recent hits: {fullReport.optimization.cacheStats.recentActivity?.memoryHits || 0}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Persistent Cache</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Avg: {fullReport.optimization.cacheStats.performanceBreakdown.persistentHitTime.toFixed(1)}ms
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        Recent hits: {fullReport.optimization.cacheStats.recentActivity?.persistentHits || 0}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">Network Requests</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Avg: {fullReport.optimization.cacheStats.performanceBreakdown.networkMissTime.toFixed(1)}ms
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        Recent misses: {fullReport.optimization.cacheStats.recentActivity?.networkMisses || 0}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Bundle Performance */}
            {fullReport?.monitoring?.bundleMetrics && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bundle Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Total Load Time"
                            value={Math.round(fullReport.monitoring.bundleMetrics.totalLoadTime)}
                            unit="ms"
                            rating={fullReport.monitoring.bundleMetrics.totalLoadTime < 2000 ? 'good' : fullReport.monitoring.bundleMetrics.totalLoadTime < 4000 ? 'needs-improvement' : 'poor'}
                        />
                        <MetricCard
                            title="Parse Time"
                            value={Math.round(fullReport.monitoring.bundleMetrics.totalParseTime)}
                            unit="ms"
                            rating={fullReport.monitoring.bundleMetrics.totalParseTime < 1000 ? 'good' : fullReport.monitoring.bundleMetrics.totalParseTime < 2000 ? 'needs-improvement' : 'poor'}
                        />
                        <MetricCard
                            title="Cache Hit Rate"
                            value={Math.round(fullReport.monitoring.bundleMetrics.cacheHitRate * 100)}
                            unit="%"
                            rating={fullReport.monitoring.bundleMetrics.cacheHitRate > 0.8 ? 'good' : fullReport.monitoring.bundleMetrics.cacheHitRate > 0.6 ? 'needs-improvement' : 'poor'}
                        />
                        <MetricCard
                            title="Largest Bundle"
                            value={fullReport.monitoring.bundleMetrics.largestBundle ? Math.round(fullReport.monitoring.bundleMetrics.largestBundle.size / 1024) : 0}
                            unit="KB"
                            description={fullReport.monitoring.bundleMetrics.largestBundle?.name}
                            rating={!fullReport.monitoring.bundleMetrics.largestBundle || fullReport.monitoring.bundleMetrics.largestBundle.size < 300 * 1024 ? 'good' : fullReport.monitoring.bundleMetrics.largestBundle.size < 500 * 1024 ? 'needs-improvement' : 'poor'}
                        />
                    </div>
                </div>
            )}

            {/* JavaScript Performance */}
            {fullReport?.monitoring?.jsPerformance && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">JavaScript Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCard
                            title="Long Tasks"
                            value={fullReport.monitoring.jsPerformance.longTaskCount}
                            description="Tasks blocking main thread > 50ms"
                            rating={fullReport.monitoring.jsPerformance.longTaskCount === 0 ? 'good' : fullReport.monitoring.jsPerformance.longTaskCount < 5 ? 'needs-improvement' : 'poor'}
                        />
                        <MetricCard
                            title="Total Blocking Time"
                            value={Math.round(fullReport.monitoring.jsPerformance.totalBlockingTime)}
                            unit="ms"
                            description="Time main thread was blocked"
                            rating={fullReport.monitoring.jsPerformance.totalBlockingTime < 100 ? 'good' : fullReport.monitoring.jsPerformance.totalBlockingTime < 300 ? 'needs-improvement' : 'poor'}
                        />
                        <MetricCard
                            title="Avg Task Duration"
                            value={Math.round(fullReport.monitoring.jsPerformance.averageTaskDuration)}
                            unit="ms"
                            rating={fullReport.monitoring.jsPerformance.averageTaskDuration < 50 ? 'good' : fullReport.monitoring.jsPerformance.averageTaskDuration < 100 ? 'needs-improvement' : 'poor'}
                        />
                    </div>
                </div>
            )}

            {/* Budget Violations */}
            {fullReport?.budgetViolations && fullReport.budgetViolations.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Performance Budget Violations</h2>
                    <Card className="p-4">
                        <div className="space-y-3">
                            {fullReport.budgetViolations.map((violation: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-error-50 dark:bg-error-900/20 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-error-800 dark:text-error-200">{violation.metric}</h4>
                                        <p className="text-sm text-error-600 dark:text-error-400">
                                            Actual: {violation.actual} | Budget: {violation.budget}
                                        </p>
                                    </div>
                                    <Badge className="bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200">
                                        Over Budget
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Recommendations */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h2>
                <RecommendationList
                    recommendations={fullReport?.optimization?.recommendations || fullReport?.webVitals?.recommendations || []}
                />
            </div>

            {/* Network Information */}
            {fullReport?.monitoring?.networkInfo && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Network Information</h2>
                    <Card className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Connection Type</h4>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {fullReport.monitoring.networkInfo.effectiveType || 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Downlink Speed</h4>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {fullReport.monitoring.networkInfo.downlink ? `${fullReport.monitoring.networkInfo.downlink} Mbps` : 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Round Trip Time</h4>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {fullReport.monitoring.networkInfo.rtt ? `${fullReport.monitoring.networkInfo.rtt} ms` : 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Last Updated */}
            {fullReport?.timestamp && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(fullReport.timestamp).toLocaleString()}
                </div>
            )}
        </div>
    );
};