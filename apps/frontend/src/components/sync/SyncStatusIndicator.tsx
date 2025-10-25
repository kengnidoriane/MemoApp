import React from 'react';
import { motion } from 'framer-motion';
import { useSyncStore } from '../../stores/syncStore';
import { useOffline } from '../../hooks/useOffline';
import { Spinner } from '../ui/Spinner';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { isOnline } = useOffline();
  const { 
    isSyncing, 
    syncProgress, 
    lastSyncAt, 
    offlineChanges, 
    conflicts,
    syncErrors 
  } = useSyncStore();

  const hasOfflineChanges = offlineChanges.length > 0;
  const hasConflicts = conflicts.length > 0;
  const hasErrors = syncErrors.length > 0;

  // Don't show if everything is normal and we don't want details
  if (!showDetails && isOnline && !isSyncing && !hasOfflineChanges && !hasConflicts && !hasErrors) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'text-error-600 bg-error-50';
    if (hasConflicts || hasErrors) return 'text-warning-600 bg-warning-50';
    if (hasOfflineChanges) return 'text-info-600 bg-info-50';
    if (isSyncing) return 'text-primary-600 bg-primary-50';
    return 'text-success-600 bg-success-50';
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
        </svg>
      );
    }

    if (isSyncing) {
      return <Spinner size="sm" />;
    }

    if (hasConflicts) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }

    if (hasOfflineChanges) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return `Syncing... ${syncProgress}%`;
    if (hasConflicts) return `${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''}`;
    if (hasOfflineChanges) return `${offlineChanges.length} pending`;
    return 'Synced';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {lastSyncAt && !isSyncing && (
            <span>
              Last sync: {new Date(lastSyncAt).toLocaleTimeString()}
            </span>
          )}
          
          {isSyncing && (
            <div className="w-16 bg-gray-200 rounded-full h-1">
              <motion.div
                className="bg-primary-500 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${syncProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SyncStatusBadgeProps {
  type: 'offline' | 'pending' | 'conflict' | 'synced';
  count?: number;
  className?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ 
  type, 
  count, 
  className = '' 
}) => {
  const getConfig = () => {
    switch (type) {
      case 'offline':
        return {
          color: 'bg-error-100 text-error-800',
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
            </svg>
          ),
          text: 'Offline',
        };
      case 'pending':
        return {
          color: 'bg-warning-100 text-warning-800',
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          text: count ? `${count} pending` : 'Pending',
        };
      case 'conflict':
        return {
          color: 'bg-error-100 text-error-800',
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          text: count ? `${count} conflict${count !== 1 ? 's' : ''}` : 'Conflict',
        };
      case 'synced':
        return {
          color: 'bg-success-100 text-success-800',
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          text: 'Synced',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: null,
          text: 'Unknown',
        };
    }
  };

  const config = getConfig();

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
};