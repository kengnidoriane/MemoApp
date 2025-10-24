import { motion } from 'framer-motion';
import { Button, Badge } from '../ui';
import { cn } from '../../utils';

interface SortOption {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

interface SortControlsProps {
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  className?: string;
}

const sortOptions: SortOption[] = [
  {
    value: 'createdAt',
    label: 'Created',
    icon: '📅',
    description: 'When the memo was first created'
  },
  {
    value: 'updatedAt',
    label: 'Updated',
    icon: '✏️',
    description: 'When the memo was last modified'
  },
  {
    value: 'title',
    label: 'Title',
    icon: '🔤',
    description: 'Alphabetical order by title'
  },
  {
    value: 'nextReviewAt',
    label: 'Review',
    icon: '🔄',
    description: 'Next scheduled review date'
  },
];

const orderOptions = [
  {
    value: 'desc',
    label: 'Newest First',
    icon: '⬇️',
    description: 'Most recent items first'
  },
  {
    value: 'asc',
    label: 'Oldest First',
    icon: '⬆️',
    description: 'Oldest items first'
  },
];

export const SortControls = ({
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: SortControlsProps) => {
  const currentSortOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];
  const currentOrderOption = orderOptions.find(option => option.value === sortOrder) || orderOptions[0];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quick Sort Buttons */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          Sort & Order
        </h4>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {currentSortOption.icon} {currentSortOption.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {currentOrderOption.icon} {currentOrderOption.label}
          </Badge>
        </div>
      </div>

      {/* Sort By Options */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Sort By
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sortOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => onSortChange(option.value, sortOrder)}
              className={cn(
                'p-3 text-sm rounded-xl border transition-all duration-200 text-left group',
                'hover:shadow-sm hover:scale-[1.02]',
                sortBy === option.value
                  ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {option.description}
                    </div>
                  )}
                </div>
                {sortBy === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sort Order Options */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Order
        </div>
        <div className="grid grid-cols-2 gap-2">
          {orderOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => onSortChange(sortBy, option.value)}
              className={cn(
                'p-3 text-sm rounded-xl border transition-all duration-200 text-left group',
                'hover:shadow-sm hover:scale-[1.02]',
                sortOrder === option.value
                  ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {option.description}
                    </div>
                  )}
                </div>
                {sortOrder === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Sort Presets */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Quick Presets
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { sortBy: 'createdAt', sortOrder: 'desc', label: 'Latest First', icon: '🆕' },
            { sortBy: 'updatedAt', sortOrder: 'desc', label: 'Recently Updated', icon: '🔄' },
            { sortBy: 'title', sortOrder: 'asc', label: 'A to Z', icon: '🔤' },
            { sortBy: 'nextReviewAt', sortOrder: 'asc', label: 'Due for Review', icon: '⏰' },
          ].map((preset) => (
            <Button
              key={`${preset.sortBy}-${preset.sortOrder}`}
              variant={
                sortBy === preset.sortBy && sortOrder === preset.sortOrder
                  ? 'primary'
                  : 'outline'
              }
              size="sm"
              onClick={() => onSortChange(preset.sortBy, preset.sortOrder)}
              className="text-xs"
            >
              <span className="mr-1">{preset.icon}</span>
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};