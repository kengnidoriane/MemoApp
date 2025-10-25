import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon, 
  FireIcon, 
  StarIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { UserAnalytics } from '@memo-app/shared/types';

interface AchievementTrackerProps {
  data?: UserAnalytics;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
  color: 'gold' | 'silver' | 'bronze' | 'blue';
}

const AchievementTracker: React.FC<AchievementTrackerProps> = ({ data }) => {
  if (!data) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Achievements
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          No achievement data available
        </div>
      </Card>
    );
  }

  const achievements: Achievement[] = [
    {
      id: 'first-memo',
      title: 'First Steps',
      description: 'Create your first memo',
      icon: <AcademicCapIcon className="w-6 h-6" />,
      isUnlocked: data.totalMemos >= 1,
      color: 'bronze',
    },
    {
      id: 'memo-creator',
      title: 'Memo Creator',
      description: 'Create 10 memos',
      icon: <ChartBarIcon className="w-6 h-6" />,
      isUnlocked: data.totalMemos >= 10,
      progress: Math.min(data.totalMemos, 10),
      maxProgress: 10,
      color: 'silver',
    },
    {
      id: 'memo-master',
      title: 'Memo Master',
      description: 'Create 50 memos',
      icon: <StarIcon className="w-6 h-6" />,
      isUnlocked: data.totalMemos >= 50,
      progress: Math.min(data.totalMemos, 50),
      maxProgress: 50,
      color: 'gold',
    },
    {
      id: 'quiz-starter',
      title: 'Quiz Starter',
      description: 'Complete your first quiz',
      icon: <TrophyIcon className="w-6 h-6" />,
      isUnlocked: data.totalQuizSessions >= 1,
      color: 'bronze',
    },
    {
      id: 'quiz-enthusiast',
      title: 'Quiz Enthusiast',
      description: 'Complete 25 quiz sessions',
      icon: <TrophyIcon className="w-6 h-6" />,
      isUnlocked: data.totalQuizSessions >= 25,
      progress: Math.min(data.totalQuizSessions, 25),
      maxProgress: 25,
      color: 'silver',
    },
    {
      id: 'streak-keeper',
      title: 'Streak Keeper',
      description: 'Maintain a 7-day learning streak',
      icon: <FireIcon className="w-6 h-6" />,
      isUnlocked: data.streakDays >= 7,
      progress: Math.min(data.streakDays, 7),
      maxProgress: 7,
      color: 'gold',
    },
    {
      id: 'consistent-learner',
      title: 'Consistent Learner',
      description: 'Maintain a 30-day learning streak',
      icon: <CalendarIcon className="w-6 h-6" />,
      isUnlocked: data.streakDays >= 30,
      progress: Math.min(data.streakDays, 30),
      maxProgress: 30,
      color: 'gold',
    },
    {
      id: 'high-scorer',
      title: 'High Scorer',
      description: 'Achieve 90% average quiz score',
      icon: <StarIcon className="w-6 h-6" />,
      isUnlocked: data.averageQuizScore >= 0.9,
      progress: Math.round(data.averageQuizScore * 100),
      maxProgress: 90,
      color: 'gold',
    },
  ];

  const getColorClasses = (color: Achievement['color'], isUnlocked: boolean) => {
    if (!isUnlocked) {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        icon: 'text-gray-400 dark:text-gray-600',
        border: 'border-gray-200 dark:border-gray-700',
      };
    }

    switch (color) {
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20',
          icon: 'text-yellow-600 dark:text-yellow-400',
          border: 'border-yellow-300 dark:border-yellow-600',
        };
      case 'silver':
        return {
          bg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700/20 dark:to-gray-600/20',
          icon: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-300 dark:border-gray-600',
        };
      case 'bronze':
        return {
          bg: 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20',
          icon: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-300 dark:border-orange-600',
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20',
          icon: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-300 dark:border-blue-600',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-700',
        };
    }
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Achievements
        </h3>
        <Badge variant="primary">
          {unlockedCount}/{achievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map((achievement, index) => {
          const colorClasses = getColorClasses(achievement.color, achievement.isUnlocked);
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${colorClasses.bg} ${colorClasses.border}
                ${achievement.isUnlocked ? 'shadow-sm hover:shadow-md' : 'opacity-60'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm ${
                    achievement.isUnlocked 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    achievement.isUnlocked 
                      ? 'text-gray-600 dark:text-gray-300' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar */}
                  {achievement.progress !== undefined && achievement.maxProgress && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={achievement.isUnlocked 
                          ? 'text-gray-600 dark:text-gray-300' 
                          : 'text-gray-400 dark:text-gray-500'
                        }>
                          Progress
                        </span>
                        <span className={achievement.isUnlocked 
                          ? 'text-gray-600 dark:text-gray-300' 
                          : 'text-gray-400 dark:text-gray-500'
                        }>
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            achievement.isUnlocked 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                          style={{
                            width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Keep learning to unlock more achievements!
          </p>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          You've unlocked {unlockedCount} out of {achievements.length} achievements. 
          {unlockedCount < achievements.length && ' Keep creating memos and taking quizzes to earn more!'}
        </p>
      </div>
    </Card>
  );
};

export default AchievementTracker;