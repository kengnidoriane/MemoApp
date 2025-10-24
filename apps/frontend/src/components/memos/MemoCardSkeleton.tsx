import { motion } from 'framer-motion';
import { Card, Skeleton } from '../ui';
import { cn } from '../../utils';

interface MemoCardSkeletonProps {
  className?: string;
}

export const MemoCardSkeleton = ({ className }: MemoCardSkeletonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('relative overflow-hidden', className)}>
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Color indicator skeleton */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-t-lg" />

        <div className="p-6">
          {/* Header skeleton */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>

          {/* Content skeleton */}
          <div className="mb-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Footer skeleton */}
          <div className="flex items-center justify-between">
            {/* Tags skeleton */}
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>

            {/* Category skeleton */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

interface MemoListSkeletonProps {
  count?: number;
  className?: string;
}

export const MemoListSkeleton = ({ count = 6, className }: MemoListSkeletonProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3,
            delay: index * 0.05 
          }}
        >
          <MemoCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};