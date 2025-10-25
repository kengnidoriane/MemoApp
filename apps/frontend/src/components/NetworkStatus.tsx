import { motion, AnimatePresence } from 'framer-motion';
import { useSyncStore } from '../stores/syncStore';
import { useOffline } from '../hooks/useOffline';
import { SyncStatusIndicator } from './sync';

export const NetworkStatus = () => {
  const { isOnline } = useOffline();
  const { isSyncing, offlineChanges, conflicts } = useSyncStore();

  // Show if offline, syncing, has offline changes, or has conflicts
  const shouldShow = !isOnline || isSyncing || offlineChanges.length > 0 || conflicts.length > 0;

  if (!shouldShow) {
    return null;
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
          <div className="flex items-center justify-center">
            <SyncStatusIndicator showDetails className="mx-auto" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};