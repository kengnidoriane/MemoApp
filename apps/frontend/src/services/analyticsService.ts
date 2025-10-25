import { api } from '../lib/api';
import type { 
  UserAnalytics,
  ActivityTrend 
} from '@memo-app/shared/types';

interface ProgressMetrics {
  totalReviews: number;
  averageRetention: number;
  streakDays: number;
  memosLearned: number;
  difficultMemos: string[];
}

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
    const response = await api.get<{ data: UserAnalytics }>('/analytics/dashboard');
    return response.data?.data || {
      totalMemos: 0,
      totalCategories: 0,
      totalQuizSessions: 0,
      totalReviews: 0,
      averageQuizScore: 0,
      streakDays: 0,
      memosCreatedThisWeek: 0,
      memosCreatedThisMonth: 0,
      quizzesCompletedThisWeek: 0,
      quizzesCompletedThisMonth: 0,
      reviewsThisWeek: 0,
      reviewsThisMonth: 0
    };
  },

  getProgressMetrics: async (): Promise<ProgressMetrics> => {
    const response = await api.get<{ data: ProgressMetrics }>('/analytics/progress');
    return response.data?.data || {
      totalReviews: 0,
      averageRetention: 0,
      streakDays: 0,
      memosLearned: 0,
      difficultMemos: []
    };
  },

  getActivityTrends: async (period: 'week' | 'month' | 'year' = 'month'): Promise<ActivityTrend[]> => {
    const response = await api.get<{ data: ActivityTrend[] }>('/analytics/activity', { period });
    return response.data?.data || [];
  },

  // Learning analytics
  getLearningStats: async (): Promise<{
    totalReviews: number;
    averageRetention: number;
    streakDays: number;
    memosLearned: number;
    difficultMemos: string[];
  }> => {
    const response = await api.get<{ data: {
      totalReviews: number;
      averageRetention: number;
      streakDays: number;
      memosLearned: number;
      difficultMemos: string[];
    } }>('/analytics/learning');
    return response.data?.data || {
      totalReviews: 0,
      averageRetention: 0,
      streakDays: 0,
      memosLearned: 0,
      difficultMemos: []
    };
  },

  // Data export
  exportData: async (options: ExportOptions): Promise<{ downloadUrl: string; expiresAt: Date }> => {
    const response = await api.post<{ data: { downloadUrl: string; expiresAt: Date } }>('/export/data', options);
    return response.data?.data || { downloadUrl: '', expiresAt: new Date() };
  },

  getExportHistory: async (): Promise<Array<{
    id: string;
    format: string;
    createdAt: Date;
    downloadUrl?: string;
    expiresAt?: Date;
    status: 'pending' | 'completed' | 'expired';
  }>> => {
    const response = await api.get<{ data: Array<{
      id: string;
      format: string;
      createdAt: Date;
      downloadUrl?: string;
      expiresAt?: Date;
      status: 'pending' | 'completed' | 'expired';
    }> }>('/export/history');
    return response.data?.data || [];
  },
};