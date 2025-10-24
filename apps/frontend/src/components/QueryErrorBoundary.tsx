import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import { motion } from 'framer-motion';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
}

const QueryErrorFallback = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-4"
    >
      <div className="card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-warning-600 dark:text-warning-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connection Error
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're having trouble connecting to our servers. Please check your internet connection and try again.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="btn btn-primary w-full"
          >
            Retry
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="btn btn-outline w-full"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

export const QueryErrorBoundary = ({ children }: QueryErrorBoundaryProps) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={<QueryErrorFallback resetErrorBoundary={reset} />}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};