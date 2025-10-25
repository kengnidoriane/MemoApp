import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSyncStore } from '../../stores/syncStore';
import { useOffline } from '../../hooks/useOffline';
import { syncManager } from '../../lib/syncManager';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { SyncStatusIndicator } from './SyncStatusIndicator';

export const SyncControlPanel: React.FC = () => {
  const { isOnline } = useOffline();
  const {
    isSyncing,
    lastSyncAt,
    offlineChanges,
    conflicts,
    syncErrors,
    autoSyncEnabled,
    syncInterval,
    setAutoSyncEnabled,
    setSyncInterval,
    clearSyncErrors,
  } = useSyncStore();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleManualSync = async () => {
    if (!isOnline) {
      return;
    }

    try {
      await syncManager.syncData();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    
    if (enabled) {
      syncManager.startAutoSync(syncInterval);
    } else {
      syncManager.stopAutoSync();
    }
  };

  const handleSyncIntervalChange = (newInterval: string) => {
    const intervalMs = parseInt(newInterval, 10);
    setSyncInterval(intervalMs);
    
    if (autoSyncEnabled) {
      syncManager.startAutoSync(intervalMs);
    }
  };

  const syncIntervalOptions = [
    { value: '10000', label: '10 seconds' },
    { value: '30000', label: '30 seconds' },
    { value: '60000', label: '1 minute' },
    { value: '300000', label: '5 minutes' },
    { value: '600000', label: '10 minutes' },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sync Status
          </h3>
          <SyncStatusIndicator showDetails />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {/* Sync Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleManualSync}
                  disabled={!isOnline || isSyncing}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {isSyncing ? (
                    <>
                      <Spinner size="sm" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Sync Now</span>
                    </>
                  )}
                </Button>

                {syncErrors.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSyncErrors}
                    className="text-error-600 hover:text-error-700"
                  >
                    Clear Errors
                  </Button>
                )}
              </div>

              {/* Auto-sync Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-sync
                  </label>
                  <Switch
                    checked={autoSyncEnabled}
                    onChange={handleToggleAutoSync}
                    disabled={!isOnline}
                  />
                </div>

                {autoSyncEnabled && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sync Interval
                    </label>
                    <Select
                      value={syncInterval.toString()}
                      onChange={handleSyncIntervalChange}
                      options={syncIntervalOptions}
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              {/* Status Details */}
              <div className="space-y-2 text-sm">
                {lastSyncAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last sync:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {offlineChanges.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pending changes:</span>
                    <span className="text-warning-600 font-medium">
                      {offlineChanges.length}
                    </span>
                  </div>
                )}

                {conflicts.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Conflicts:</span>
                    <span className="text-error-600 font-medium">
                      {conflicts.length}
                    </span>
                  </div>
                )}

                {!isOnline && (
                  <div className="flex items-center space-x-2 text-error-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>You're offline. Changes will sync when you're back online.</span>
                  </div>
                )}
              </div>

              {/* Sync Errors */}
              {syncErrors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-error-600">Recent Errors:</h4>
                  <div className="space-y-1">
                    {syncErrors.slice(-3).map((error, index) => (
                      <div key={index} className="text-xs text-error-600 bg-error-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};