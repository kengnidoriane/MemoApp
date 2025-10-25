import { useMutation, useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  progress: () => [...analyticsKeys.all, 'progress'] as const,
  activity: (period: string) => [...analyticsKeys.all, 'activity', period] as const,
  learning: () => [...analyticsKeys.all, 'learning'] as const,
  export: () => [...analyticsKeys.all, 'export'] as const,
};

// Analytics hooks
export const useDashboardAnalytics = () => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: analyticsService.getDashboardAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProgressMetrics = () => {
  return useQuery({
    queryKey: analyticsKeys.progress(),
    queryFn: analyticsService.getProgressMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useActivityTrends = (period: 'week' | 'month' | 'year' = 'month') => {
  return useQuery({
    queryKey: analyticsKeys.activity(period),
    queryFn: () => analyticsService.getActivityTrends(period),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLearningStats = () => {
  return useQuery({
    queryKey: analyticsKeys.learning(),
    queryFn: analyticsService.getLearningStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Data export hooks
export const useExportData = () => {
  return useMutation({
    mutationFn: analyticsService.exportData,
  });
};

export const useExportHistory = () => {
  return useQuery({
    queryKey: analyticsKeys.export(),
    queryFn: analyticsService.getExportHistory,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};