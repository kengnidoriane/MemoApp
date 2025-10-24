import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';

export const PWAUpdateNotification = () => {
  const { needRefresh, offlineReady, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  const showNotification = (needRefresh || offlineReady) && !dismissed;

  const handleUpdate = async () => {
    try {
      await updateApp();
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className="border-primary-200 bg-primary-50 dark:bg-primary-900 dark:border-primary-700">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {needRefresh ? (
                    <svg
                      className="w-6 h-6 text-primary-600 dark:text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-success-600 dark:text-success-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <Typography variant="body-small" weight="medium" className="text-primary-800 dark:text-primary-200">
                    {needRefresh ? 'App Update Available' : 'App Ready for Offline Use'}
                  </Typography>
                  <Typography variant="caption" className="text-primary-600 dark:text-primary-300 mt-1">
                    {needRefresh 
                      ? 'A new version of MemoApp is available. Update now for the latest features.'
                      : 'MemoApp is now ready to work offline. You can use it even without an internet connection.'
                    }
                  </Typography>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-primary-400 hover:text-primary-600 dark:text-primary-500 dark:hover:text-primary-300 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {needRefresh && (
                <div className="mt-4 flex space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleUpdate}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    Update Now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-300 dark:hover:bg-primary-800"
                  >
                    Later
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};