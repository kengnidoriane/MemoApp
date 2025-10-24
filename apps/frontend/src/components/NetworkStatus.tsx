import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, useSyncStore } from '../stores';

export const NetworkStatus = () => {
  const { isOnline } = useAppStore();
  const { isSyncing, lastSyncAt, offlineChanges } = useSyncStore();

  if (isOnline && !isSyncing && offlineChanges.length === 0) {
    return null; // Don't show anything when everything is normal
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-success-500' : 'bg-error-500'
                }`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Sync Status */}
              {isSyncing && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Syncing...
                  </span>
                </div>
              )}

              {/* Offline Changes */}
              {offlineChanges.length > 0 && (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm text-warning-700 dark:text-warning-400">
                    {offlineChanges.length} unsaved change{offlineChanges.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Last Sync Time */}
            {lastSyncAt && !isSyncing && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last sync: {new Date(lastSyncAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};