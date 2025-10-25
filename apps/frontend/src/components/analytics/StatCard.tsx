import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  blue: {
    icon: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    icon: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    trend: 'text-green-600 dark:text-green-400',
  },
  purple: {
    icon: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
    trend: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    icon: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
    trend: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    icon: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
    trend: 'text-red-600 dark:text-red-400',
  },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'blue',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend !== undefined && trendLabel && (
              <p className={`text-sm mt-2 ${colorClasses[color].trend}`}>
                +{trend} {trendLabel}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color].icon}`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;