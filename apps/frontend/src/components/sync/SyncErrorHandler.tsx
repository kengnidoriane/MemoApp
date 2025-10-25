import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSyncStore } from '../../stores/syncStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useManualSync } from './AutoSyncHandler';

interface SyncErrorHandlerProps {
  className?: string;
}

export const SyncErrorHandler: React.FC<SyncErrorHandlerProps> = ({ 
  className = '' 
}) => {
  const { syncErrors, clearSyncErrors } = useSyncStore();
  const { triggerManualSync, canSync } = useManualSync();

  // Auto-clear old errors after 30 seconds
  useEffect(() => {
    if (syncErrors.length > 0) {
      const timeout = setTimeout(() => {
        clearSyncErrors();
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [syncErrors, clearSyncErrors]);

  const handleRetrySync = async () => {
    clearSyncErrors();
    await triggerManualSync();
  };

  if (syncErrors.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-20 left-4 right-4 z-30 ${className}`}
      >
        <Card className="p-4 bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg 
                className="w-5 h-5 text-error-600 dark:text-error-400 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-error-800 dark:text-error-200">
                Sync Error{syncErrors.length > 1 ? 's' : ''}
              </h3>
              
              <div className="mt-2 space-y-1">
                {syncErrors.slice(0, 3).map((error, index) => (
                  <p key={index} className="text-sm text-error-700 dark:text-error-300">
                    {error}
                  </p>
                ))}
                
                {syncErrors.length > 3 && (
                  <p className="text-sm text-error-600 dark:text-error-400">
                    ... and {syncErrors.length - 3} more error{syncErrors.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex-shrink-0 flex items-center space-x-2">
              {canSync && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetrySync}
                  className="text-error-700 border-error-300 hover:bg-error-100 dark:text-error-300 dark:border-error-600 dark:hover:bg-error-800"
                >
                  Retry
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSyncErrors}
                className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Toast-style sync error notifications
 */
export const SyncErrorToast: React.FC = () => {
  const { syncErrors, clearSyncErrors } = useSyncStore();
  const [visibleErrors, setVisibleErrors] = React.useState<string[]>([]);

  useEffect(() => {
    // Show new errors as toasts
    const newErrors = syncErrors.filter(error => !visibleErrors.includes(error));
    
    if (newErrors.length > 0) {
      setVisibleErrors(prev => [...prev, ...newErrors]);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setVisibleErrors(prev => prev.filter(error => !newErrors.includes(error)));
      }, 5000);
    }
  }, [syncErrors, visibleErrors]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {visibleErrors.map((error, index) => (
          <motion.div
            key={`${error}-${index}`}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="max-w-sm"
          >
            <Card className="p-3 bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 shadow-lg">
              <div className="flex items-start space-x-2">
                <svg 
                  className="w-4 h-4 text-error-600 dark:text-error-400 mt-0.5 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-error-800 dark:text-error-200">
                    Sync Failed
                  </p>
                  <p className="text-xs text-error-700 dark:text-error-300 mt-1 line-clamp-2">
                    {error}
                  </p>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setVisibleErrors(prev => prev.filter(e => e !== error));
                  }}
                  className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300 p-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};