import React from 'react';
import { motion } from 'framer-motion';
import { SyncStatusBadge } from './SyncStatusIndicator';

interface ItemSyncStatusProps {
  itemId: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
  className?: string;
  showLabel?: boolean;
}

export const ItemSyncStatus: React.FC<ItemSyncStatusProps> = ({
  itemId,
  syncStatus = 'synced',
  className = '',
  showLabel = false,
}) => {
  // Don't show anything for synced items unless explicitly requested
  if (syncStatus === 'synced' && !showLabel) {
    return null;
  }

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'pending':
        return {
          icon: (
            <motion.svg
              className="w-3 h-3 text-warning-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </motion.svg>
          ),
          tooltip: 'Pending sync',
          color: 'text-warning-500',
        };
      case 'conflict':
        return {
          icon: (
            <motion.svg
              className="w-3 h-3 text-error-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </motion.svg>
          ),
          tooltip: 'Sync conflict - needs resolution',
          color: 'text-error-500',
        };
      case 'synced':
        return {
          icon: (
            <svg className="w-3 h-3 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          tooltip: 'Synced',
          color: 'text-success-500',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  // Check if this is a temporary ID (offline created item)
  const isTemporary = itemId.startsWith('temp-');

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div 
        className="relative group cursor-help"
        title={config.tooltip}
      >
        {config.icon}
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {config.tooltip}
          {isTemporary && (
            <div className="text-xs text-gray-300">Created offline</div>
          )}
        </div>
      </div>

      {showLabel && (
        <span className={`text-xs font-medium ${config.color}`}>
          {syncStatus === 'pending' && 'Pending'}
          {syncStatus === 'conflict' && 'Conflict'}
          {syncStatus === 'synced' && 'Synced'}
        </span>
      )}

      {isTemporary && (
        <span className="text-xs text-gray-400 italic">
          (offline)
        </span>
      )}
    </div>
  );
};

interface BulkSyncStatusProps {
  items: Array<{ id: string; syncStatus?: 'synced' | 'pending' | 'conflict' }>;
  className?: string;
}

export const BulkSyncStatus: React.FC<BulkSyncStatusProps> = ({
  items,
  className = '',
}) => {
  const statusCounts = items.reduce((acc, item) => {
    const status = item.syncStatus || 'synced';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalItems = items.length;
  const pendingCount = statusCounts.pending || 0;
  const conflictCount = statusCounts.conflict || 0;
  const syncedCount = statusCounts.synced || 0;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {totalItems} item{totalItems !== 1 ? 's' : ''}:
      </span>
      
      <div className="flex items-center space-x-1">
        {syncedCount > 0 && (
          <SyncStatusBadge type="synced" count={syncedCount} />
        )}
        
        {pendingCount > 0 && (
          <SyncStatusBadge type="pending" count={pendingCount} />
        )}
        
        {conflictCount > 0 && (
          <SyncStatusBadge type="conflict" count={conflictCount} />
        )}
      </div>
    </div>
  );
};