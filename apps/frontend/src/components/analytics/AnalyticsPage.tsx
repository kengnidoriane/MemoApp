import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  TrophyIcon, 
  CalendarIcon,
  ArrowDownTrayIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline';
import { useDashboardAnalytics, useActivityTrends, useLearningStats } from '../../hooks/useAnalytics';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import StatCard from './StatCard';
import ProgressChart from './ProgressChart';
import ActivityChart from './ActivityChart';
import LearningMetrics from './LearningMetrics';
import AchievementTracker from './AchievementTracker';
import DataExportModal from './DataExportModal';
import AccountDeletionModal from './AccountDeletionModal';

const AnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardAnalytics();
  const { data: activityData, isLoading: isActivityLoading } = useActivityTrends(selectedPeriod);
  const { data: learningData, isLoading: isLearningLoading } = useLearningStats();

  const isLoading = isDashboardLoading || isActivityLoading || isLearningLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track your learning progress and insights
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Data
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
            >
              <UserMinusIcon className="w-4 h-4" />
              Account Settings
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Memos"
            value={dashboardData?.totalMemos || 0}
            icon={<ChartBarIcon className="w-6 h-6" />}
            trend={dashboardData?.memosCreatedThisWeek || 0}
            trendLabel="this week"
            color="blue"
          />
          <StatCard
            title="Quiz Sessions"
            value={dashboardData?.totalQuizSessions || 0}
            icon={<TrophyIcon className="w-6 h-6" />}
            trend={dashboardData?.quizzesCompletedThisWeek || 0}
            trendLabel="this week"
            color="green"
          />
          <StatCard
            title="Average Score"
            value={`${Math.round((dashboardData?.averageQuizScore || 0) * 100)}%`}
            icon={<ChartBarIcon className="w-6 h-6" />}
            trend={dashboardData?.totalReviews || 0}
            trendLabel="total reviews"
            color="purple"
          />
          <StatCard
            title="Learning Streak"
            value={`${dashboardData?.streakDays || 0} days`}
            icon={<CalendarIcon className="w-6 h-6" />}
            trend={dashboardData?.reviewsThisWeek || 0}
            trendLabel="reviews this week"
            color="orange"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Progress Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Learning Progress
              </h3>
            </div>
            <ProgressChart data={learningData} />
          </Card>

          {/* Activity Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Activity Trends
              </h3>
              <div className="flex gap-2">
                {(['week', 'month', 'year'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className="capitalize"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            <ActivityChart data={activityData || []} period={selectedPeriod} />
          </Card>
        </div>

        {/* Learning Metrics and Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LearningMetrics data={learningData} />
          <AchievementTracker data={dashboardData} />
        </div>

        {/* Modals */}
        <DataExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
        
        <AccountDeletionModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;