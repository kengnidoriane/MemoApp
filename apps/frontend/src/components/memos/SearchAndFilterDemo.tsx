import { useState } from 'react';
import { motion } from 'framer-motion';
import { MemoFilters } from './MemoFilters';
import { SearchResults } from './SearchResults';
import { EmptyState } from './EmptyState';
import { MemoCardSkeleton } from './MemoCardSkeleton';
import { Card } from '../ui';
import type { MemoSearchParams } from '../../services/memoService';

/**
 * Demo component showcasing the enhanced search and filtering functionality
 * This demonstrates all the improvements made in task 12.3:
 * - Real-time search with debouncing
 * - Advanced filtering with clean toggle design
 * - Enhanced sorting controls with visual hierarchy
 * - Improved empty states with helpful illustrations
 * - Loading skeletons with shimmer effects
 * - Consistent spacing and typography
 */
export const SearchAndFilterDemo = () => {
  const [filters, setFilters] = useState<MemoSearchParams>({
    page: 1,
    limit: 20,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleFiltersChange = (newFilters: MemoSearchParams) => {
    setFilters(newFilters);
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 1000);
  };

  const handleClearSearch = () => {
    setFilters({ page: 1, limit: 20 });
    setShowResults(false);
  };

  const mockTotalResults = filters.search ? 5 : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Enhanced Search & Filtering Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          This demo showcases the improved search and filtering functionality with real-time search,
          advanced filters, enhanced sorting controls, and better empty states.
        </p>
      </div>

      {/* Enhanced Filters */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔍 Enhanced Search & Filters
        </h2>
        <MemoFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
          totalResults={showResults ? mockTotalResults : undefined}
        />
      </Card>

      {/* Search Results */}
      {filters.search && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SearchResults
            query={filters.search}
            totalResults={mockTotalResults}
            onClearSearch={handleClearSearch}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {/* Results Area */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📋 Results Area
        </h2>
        
        {isLoading ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              ✨ Enhanced Loading Skeletons
            </h3>
            <div className="space-y-4">
              <MemoCardSkeleton />
              <MemoCardSkeleton />
              <MemoCardSkeleton />
            </div>
          </div>
        ) : showResults && mockTotalResults === 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              🎨 Enhanced Empty States
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <EmptyState
                title="No search results"
                description="No memos found matching your search. Try different keywords."
                variant="search"
              />
              <EmptyState
                title="No memos match filters"
                description="Try adjusting your category, tags, or date filters."
                variant="filter"
              />
              <EmptyState
                title="No memos yet"
                description="Create your first memo to start building your knowledge collection."
                variant="default"
                action={{
                  label: "Create First Memo",
                  onClick: () => alert('Create memo clicked!')
                }}
              />
            </div>
          </div>
        ) : showResults ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              ✅ Mock Results Found
            </h3>
            <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <div className="text-green-600 dark:text-green-400 text-lg font-medium">
                🎉 Found {mockTotalResults} memos matching your criteria!
              </div>
              <p className="text-green-700 dark:text-green-300 mt-2">
                In a real application, the filtered memo cards would appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🔍</div>
            <p>Use the search and filters above to see the enhanced functionality in action!</p>
          </div>
        )}
      </Card>

      {/* Feature Highlights */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ✨ Enhanced Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">⚡</span>
              Real-time Search
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Debounced search with smooth transitions and loading indicators
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">🎛️</span>
              Advanced Filters
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clean toggle design with visual feedback and filter counts
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">📊</span>
              Smart Sorting
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clear visual hierarchy with quick presets and detailed options
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">🎨</span>
              Better Empty States
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Helpful illustrations and contextual messaging for different scenarios
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">✨</span>
              Loading Skeletons
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Shimmer effects and smooth animations for better perceived performance
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">🎯</span>
              Consistent Design
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unified spacing, typography, and interaction patterns throughout
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};