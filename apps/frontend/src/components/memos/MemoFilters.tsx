import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoSearchParams } from '../../services/memoService';
import { useCategories } from '../../hooks/useCategories';
import { TagManager } from './TagManager';
import { Button, Input, Card, Badge } from '../ui';
import { cn } from '../../utils';

// Simple debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeout: NodeJS.Timeout;
  const debouncedFunc = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debouncedFunc.cancel = () => clearTimeout(timeout);
  return debouncedFunc;
};

interface MemoFiltersProps {
  filters: MemoSearchParams;
  onFiltersChange: (filters: MemoSearchParams) => void;
  className?: string;
  isLoading?: boolean;
  totalResults?: number;
}

export const MemoFilters = ({
  filters,
  onFiltersChange,
  className,
  isLoading = false,
  totalResults,
}: MemoFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const { data: categories = [] } = useCategories();

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      handleFilterChange('search', value || undefined);
    }, 300),
    [filters]
  );

  useEffect(() => {
    debouncedSearch(searchValue);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchValue, debouncedSearch]);

  const handleFilterChange = (key: keyof MemoSearchParams, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  const handleTagsChange = (tags: string[]) => {
    handleFilterChange('tags', tags.length > 0 ? tags : undefined);
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onFiltersChange({
      page: 1,
      limit: filters.limit || 20,
    });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.categoryId ||
    filters.tags?.length ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sortBy !== 'createdAt' ||
    filters.sortOrder !== 'desc'
  );

  const activeFilterCount = [
    filters.search && 'search',
    filters.categoryId && 'category',
    filters.tags?.length && 'tags',
    (filters.dateFrom || filters.dateTo) && 'date',
    (filters.sortBy && filters.sortBy !== 'createdAt') && 'sort',
    (filters.sortOrder && filters.sortOrder !== 'desc') && 'order'
  ].filter(Boolean).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Quick Filters */}
      <Card className="space-y-6">
        {/* Search Bar with Results Info */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search memos by title, content, or tags..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pr-12"
                leftIcon={
                  <motion.div
                    animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </motion.div>
                }
                rightIcon={
                  searchValue && (
                    <button
                      onClick={() => setSearchValue('')}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )
                }
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center relative"
            >
              <motion.svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </motion.svg>
              Filters
              {hasActiveFilters && (
                <Badge variant="primary" className="ml-2 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All
              </Button>
            )}
          </div>

          {/* Search Results Summary */}
          <AnimatePresence>
            {(filters.search || totalResults !== undefined) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
              >
                <div className="flex items-center space-x-2">
                  {filters.search && (
                    <span>
                      Searching for <strong>"{filters.search}"</strong>
                    </span>
                  )}
                  {totalResults !== undefined && (
                    <span>
                      • {totalResults} {totalResults === 1 ? 'result' : 'results'} found
                    </span>
                  )}
                </div>
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Category Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick Filters
            </span>
            {categories.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-xs"
              >
                View All Categories
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <motion.button
              onClick={() => handleFilterChange('categoryId', undefined)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-all duration-200 flex items-center space-x-1',
                !filters.categoryId
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>All Categories</span>
              {!filters.categoryId && categories.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {categories.reduce((sum, cat) => sum + (cat.memoCount || 0), 0)}
                </Badge>
              )}
            </motion.button>
            
            {categories.slice(0, 5).map((category) => (
              <motion.button
                key={category.id}
                onClick={() => handleFilterChange('categoryId', category.id)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full transition-all duration-200 flex items-center space-x-2 border',
                  filters.categoryId === category.id
                    ? 'text-white shadow-sm border-transparent'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600'
                )}
                style={{
                  backgroundColor: filters.categoryId === category.id ? category.color : undefined,
                  borderColor: filters.categoryId === category.id ? category.color : undefined
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    filters.categoryId === category.id ? 'bg-white/80' : ''
                  )}
                  style={{ 
                    backgroundColor: filters.categoryId === category.id ? 'rgba(255,255,255,0.8)' : category.color 
                  }}
                />
                <span className="font-medium">{category.name}</span>
                {category.memoCount !== undefined && category.memoCount > 0 && (
                  <Badge 
                    variant={filters.categoryId === category.id ? "secondary" : "outline"} 
                    className="text-xs"
                  >
                    {category.memoCount}
                  </Badge>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </Card>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tag Filter */}
              <TagManager
                selectedTags={filters.tags || []}
                onTagsChange={handleTagsChange}
              />

              {/* Date and Sort Filters */}
              <Card className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date & Sorting
                  </h3>
                  {(filters.dateFrom || filters.dateTo || filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleFilterChange('dateFrom', undefined);
                        handleFilterChange('dateTo', undefined);
                        handleFilterChange('sortBy', 'createdAt');
                        handleFilterChange('sortOrder', 'desc');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Reset
                    </Button>
                  )}
                </div>

                {/* Date Range */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date Range
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        From Date
                      </label>
                      <Input
                        type="date"
                        value={filters.dateFrom ? new Date(filters.dateFrom).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        To Date
                      </label>
                      <Input
                        type="date"
                        value={filters.dateTo ? new Date(filters.dateTo).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Quick Date Presets */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Today', days: 0 },
                      { label: 'Last 7 days', days: 7 },
                      { label: 'Last 30 days', days: 30 },
                      { label: 'Last 90 days', days: 90 },
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const fromDate = new Date(today);
                          fromDate.setDate(today.getDate() - preset.days);
                          
                          handleFilterChange('dateFrom', fromDate.toISOString().split('T')[0]);
                          handleFilterChange('dateTo', today.toISOString().split('T')[0]);
                        }}
                        className="text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sort Options
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Sort By */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Sort By
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'createdAt', label: 'Created', icon: '📅' },
                          { value: 'updatedAt', label: 'Updated', icon: '✏️' },
                          { value: 'title', label: 'Title', icon: '🔤' },
                          { value: 'nextReviewAt', label: 'Review', icon: '🔄' },
                        ].map((option) => (
                          <motion.button
                            key={option.value}
                            onClick={() => handleFilterChange('sortBy', option.value)}
                            className={cn(
                              'p-2 text-sm rounded-lg border transition-all duration-200 flex items-center space-x-2',
                              filters.sortBy === option.value || (!filters.sortBy && option.value === 'createdAt')
                                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>{option.icon}</span>
                            <span className="font-medium">{option.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Sort Order */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Order
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'desc', label: 'Newest First', icon: '⬇️' },
                          { value: 'asc', label: 'Oldest First', icon: '⬆️' },
                        ].map((option) => (
                          <motion.button
                            key={option.value}
                            onClick={() => handleFilterChange('sortOrder', option.value)}
                            className={cn(
                              'p-2 text-sm rounded-lg border transition-all duration-200 flex items-center space-x-2',
                              filters.sortOrder === option.value || (!filters.sortOrder && option.value === 'desc')
                                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>{option.icon}</span>
                            <span className="font-medium">{option.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Sort Presets */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Quick Presets
                      </label>
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
                              (filters.sortBy || 'createdAt') === preset.sortBy && 
                              (filters.sortOrder || 'desc') === preset.sortOrder
                                ? 'primary'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              handleFilterChange('sortBy', preset.sortBy);
                              handleFilterChange('sortOrder', preset.sortOrder);
                            }}
                            className="text-xs"
                          >
                            <span className="mr-1">{preset.icon}</span>
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};