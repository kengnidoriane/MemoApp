import React from 'react';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  ChartBarIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface LearningMetricsProps {
  data?: {
    totalReviews: number;
    averageRetention: number;
    streakDays: number;
    memosLearned: number;
    difficultMemos: string[];
  };
}

const LearningMetrics: React.FC<LearningMetricsProps> = ({ data }) => {
  if (!data) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Learning Metrics
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          No learning data available
        </div>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Total Reviews',
      value: data.totalReviews,
      icon: <ChartBarIcon className="w-5 h-5" />,
      color: 'blue' as const,
    },
    {
      label: 'Memos Learned',
      value: data.memosLearned,
      icon: <AcademicCapIcon className="w-5 h-5" />,
      color: 'green' as const,
    },
    {
      label: 'Current Streak',
      value: `${data.streakDays} days`,
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'purple' as const,
    },
    {
      label: 'Difficult Memos',
      value: data.difficultMemos.length,
      icon: <ExclamationTriangleIcon className="w-5 h-5" />,
      color: 'orange' as const,
    },
  ];

  const getRetentionColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600 dark:text-green-400';
    if (rate >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRetentionLabel = (rate: number) => {
    if (rate >= 0.8) return 'Excellent';
    if (rate >= 0.6) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Learning Metrics
      </h3>

      {/* Retention Rate Highlight */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Average Retention Rate
            </p>
            <p className={`text-2xl font-bold ${getRetentionColor(data.averageRetention)}`}>
              {Math.round(data.averageRetention * 100)}%
            </p>
          </div>
          <Badge 
            variant={data.averageRetention >= 0.8 ? 'success' : data.averageRetention >= 0.6 ? 'warning' : 'error'}
          >
            {getRetentionLabel(data.averageRetention)}
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`
                p-1 rounded 
                ${metric.color === 'blue' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400' : ''}
                ${metric.color === 'green' ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400' : ''}
                ${metric.color === 'purple' ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400' : ''}
                ${metric.color === 'orange' ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400' : ''}
              `}>
                {metric.icon}
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {metric.label}
              </p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Difficult Memos List */}
      {data.difficultMemos.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Memos Needing Attention
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.difficultMemos.slice(0, 5).map((memoTitle, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm"
              >
                <ExclamationTriangleIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span className="text-gray-900 dark:text-white truncate">
                  {memoTitle}
                </span>
              </div>
            ))}
            {data.difficultMemos.length > 5 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{data.difficultMemos.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default LearningMetrics;