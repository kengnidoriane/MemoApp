import { api } from '../lib/api';
import type { 
  UserAnalytics,
  ProgressMetrics,
  ActivityTrend 
} from '@memo-app/shared/types';

export interface ExportOptions {
  format: 'pdf' | 'txt' | 'json';
  includeCategories?: boolean;
  includeProgress?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const analyticsService = {
  // Dashboard analytics
  getDashboardAnalytics: async (): Promise<UserAnalytics> => {
    const response = await api.get<UserAnalytics>('/analytics/dashboard');
    return response.data;
  },

  getProgressMetrics: async (): Promise<ProgressMetrics> => {
    const response = await api.get<ProgressMetrics>('/analytics/progress');
    return response.data;
  },

  getActivityTrends: async (period: 'week' | 'month' | 'year' = 'month'): Promise<ActivityTrend[]> => {
    const response = await api.get<ActivityTrend[]>('/analytics/activity', { period });
    return response.data;
  },

  // Learning analytics
  getLearningStats: async (): Promise<{
    totalReviews: number;
    averageRetention: number;
    streakDays: number;
    memosLearned: number;
    difficultMemos: string[];
  }> => {
    const response = await api.get('/analytics/learning');
    return response.data;
  },

  // Data export
  exportData: async (options: ExportOptions): Promise<{ downloadUrl: string; expiresAt: Date }> => {
    const response = await api.post<{ downloadUrl: string; expiresAt: Date }>('/export/data', options);
    return response.data;
  },

  getExportHistory: async (): Promise<Array<{
    id: string;
    format: string;
    createdAt: Date;
    downloadUrl?: string;
    expiresAt?: Date;
    status: 'pending' | 'completed' | 'expired';
  }>> => {
    const response = await api.get('/export/history');
    return response.data;
  },
};