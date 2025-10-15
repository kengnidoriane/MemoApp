export interface UserAnalytics {
  totalMemos: number;
  totalCategories: number;
  totalQuizSessions: number;
  totalReviews: number;
  averageQuizScore: number;
  streakDays: number;
  memosCreatedThisWeek: number;
  memosCreatedThisMonth: number;
  quizzesCompletedThisWeek: number;
  quizzesCompletedThisMonth: number;
  reviewsThisWeek: number;
  reviewsThisMonth: number;
}

export interface ActivityTrend {
  date: string; // ISO date string
  memosCreated: number;
  quizzesCompleted: number;
  reviewsCompleted: number;
}

export interface LearningMetrics {
  totalMemosInReview: number;
  memosNeedingReview: number;
  averageRetentionRate: number;
  difficultyDistribution: {
    level1: number; // Very Easy
    level2: number; // Easy
    level3: number; // Medium
    level4: number; // Hard
    level5: number; // Very Hard
  };
  retentionByDifficulty: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
}

export interface AnalyticsDashboard {
  userAnalytics: UserAnalytics;
  activityTrends: ActivityTrend[];
  learningMetrics: LearningMetrics;
  lastUpdated: string;
}

export interface ExportFormat {
  format: 'pdf' | 'txt' | 'json';
  includeCategories?: boolean;
  includeTags?: boolean;
  includeMetadata?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ExportResult {
  downloadUrl: string;
  filename: string;
  size: number;
  expiresAt: string;
}