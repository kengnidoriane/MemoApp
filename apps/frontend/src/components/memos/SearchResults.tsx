import { motion } from 'framer-motion';
import { Badge, Button } from '../ui';
import { cn } from '../../utils';

interface SearchResultsProps {
  query: string;
  totalResults: number;
  className?: string;
  onClearSearch?: () => void;
  isLoading?: boolean;
}

export const SearchResults = ({
  query,
  totalResults,
  className,
  onClearSearch,
  isLoading = false,
}: SearchResultsProps) => {
  if (!query) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        'border-blue-200 dark:border-blue-800 shadow-sm',
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
          <defs>
            <pattern id="search-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#search-pattern)" />
        </svg>
      </div>

      <div className="relative p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                />
              ) : (
                <div className="w-5 h-5 bg-blue-600 dark:bg-blue-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white dark:text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Search results for
                </p>
                <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600">
                  "{query}"
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {isLoading ? (
                    <span className="flex items-center space-x-1">
                      <span>Searching...</span>
                    </span>
                  ) : (
                    <>
                      <span className="font-medium">{totalResults}</span>
                      <span>{totalResults === 1 ? 'memo' : 'memos'} found</span>
                    </>
                  )}
                </p>
                
                {!isLoading && totalResults > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Instant search</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant="secondary" 
              className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-semibold"
            >
              {totalResults}
            </Badge>
            
            {onClearSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSearch}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Utility function to highlight search terms in text
export const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};