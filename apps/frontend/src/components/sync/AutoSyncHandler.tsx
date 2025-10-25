import React, { useEffect, useRef } from 'react';
import { useOffline } from '../../hooks/useOffline';
import { useSyncStore } from '../../stores/syncStore';
import { syncManager } from '../../lib/syncManager';
import { offlineQueueManager } from '../../lib/offlineQueueManager';
import { useAuthStore } from '../../stores/authStore';

/**
 * Component that handles automatic synchronization when coming back online
 * and manages sync intervals
 */
export const AutoSyncHandler: React.FC = () => {
  const { isOnline, wasOffline } = useOffline();
  const { isAuthenticated } = useAuthStore();
  const { 
    autoSyncEnabled, 
    syncInterval, 
    isSyncing,
    offlineChanges,
    addSyncError 
  } = useSyncStore();
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncAttemptRef = useRef<number>(0);
  const minSyncInterval = 5000; // Minimum 5 seconds between sync attempts

  // Initialize sync manager on mount
  useEffect(() => {
    if (isAuthenticated) {
      syncManager.initialize();
    }

    return () => {
      syncManager.destroy();
    };
  }, [isAuthenticated]);

  // Handle coming back online
  useEffect(() => {
    if (isOnline && wasOffline && isAuthenticated && !isSyncing) {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncAttemptRef.current;
      
      // Only sync if enough time has passed since last attempt
      if (timeSinceLastSync >= minSyncInterval) {
        handleAutoSync('reconnect');
      }
    }
  }, [isOnline, wasOffline, isAuthenticated, isSyncing]);

  // Handle periodic auto-sync
  useEffect(() => {
    if (!autoSyncEnabled || !isOnline || !isAuthenticated) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      return;
    }

    const scheduleNextSync = () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        if (isOnline && isAuthenticated && !isSyncing) {
          handleAutoSync('periodic');
        }
        scheduleNextSync(); // Schedule next sync
      }, syncInterval);
    };

    scheduleNextSync();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [autoSyncEnabled, syncInterval, isOnline, isAuthenticated, isSyncing]);

  // Handle offline changes when they're added
  useEffect(() => {
    if (isOnline && isAuthenticated && offlineChanges.length > 0 && !isSyncing) {
      // Debounce sync when offline changes are detected
      const debounceTimeout = setTimeout(() => {
        const now = Date.now();
        const timeSinceLastSync = now - lastSyncAttemptRef.current;
        
        if (timeSinceLastSync >= minSyncInterval) {
          handleAutoSync('offline-changes');
        }
      }, 2000); // Wait 2 seconds for more changes

      return () => clearTimeout(debounceTimeout);
    }
  }, [offlineChanges.length, isOnline, isAuthenticated, isSyncing]);

  const handleAutoSync = async (trigger: 'reconnect' | 'periodic' | 'offline-changes') => {
    if (!isOnline || !isAuthenticated || isSyncing) {
      return;
    }

    lastSyncAttemptRef.current = Date.now();

    try {
      console.log(`Auto-sync triggered by: ${trigger}`);
      
      // Process offline queue first
      if (offlineChanges.length > 0) {
        const queueResult = await offlineQueueManager.processQueue();
        console.log('Queue processing result:', queueResult);
        
        if (queueResult.errors.length > 0) {
          queueResult.errors.forEach(error => addSyncError(error));
        }
      }

      // Then perform full sync
      const syncResult = await syncManager.syncData();
      console.log('Sync result:', syncResult);
      
      if (!syncResult.success && syncResult.errors.length > 0) {
        syncResult.errors.forEach(error => addSyncError(error));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-sync failed';
      console.error('Auto-sync error:', errorMessage);
      addSyncError(errorMessage);
    }
  };

  // This component doesn't render anything
  return null;
};

/**
 * Hook for manual sync operations
 */
export const useManualSync = () => {
  const { isOnline } = useOffline();
  const { isAuthenticated } = useAuthStore();
  const { isSyncing, addSyncError } = useSyncStore();

  const triggerManualSync = async (): Promise<boolean> => {
    if (!isOnline) {
      addSyncError('Cannot sync while offline');
      return false;
    }

    if (!isAuthenticated) {
      addSyncError('Must be authenticated to sync');
      return false;
    }

    if (isSyncing) {
      addSyncError('Sync already in progress');
      return false;
    }

    try {
      // Process offline queue first
      const queueResult = await offlineQueueManager.processQueue();
      console.log('Manual queue processing result:', queueResult);

      // Then perform full sync
      const syncResult = await syncManager.syncData();
      console.log('Manual sync result:', syncResult);

      if (syncResult.success) {
        return true;
      } else {
        syncResult.errors.forEach(error => addSyncError(error));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Manual sync failed';
      console.error('Manual sync error:', errorMessage);
      addSyncError(errorMessage);
      return false;
    }
  };

  const forceFullSync = async (): Promise<boolean> => {
    if (!isOnline) {
      addSyncError('Cannot sync while offline');
      return false;
    }

    if (!isAuthenticated) {
      addSyncError('Must be authenticated to sync');
      return false;
    }

    try {
      // Clear all local data and re-sync everything
      console.log('Performing force full sync...');
      
      // This would clear local cache and re-download everything
      // Implementation depends on specific sync strategy
      const syncResult = await syncManager.syncData();
      
      return syncResult.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Force sync failed';
      console.error('Force sync error:', errorMessage);
      addSyncError(errorMessage);
      return false;
    }
  };

  return {
    triggerManualSync,
    forceFullSync,
    canSync: isOnline && isAuthenticated && !isSyncing,
  };
};