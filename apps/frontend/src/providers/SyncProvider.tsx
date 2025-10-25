import React, { useState } from 'react';
import { AutoSyncHandler } from '../components/sync/AutoSyncHandler';
import { SyncErrorHandler, SyncErrorToast } from '../components/sync/SyncErrorHandler';
import { ConflictResolutionModal } from '../components/sync/ConflictResolutionModal';
import { useSyncStore } from '../stores/syncStore';

interface SyncProviderProps {
  children: React.ReactNode;
  showErrorToasts?: boolean;
  showErrorBanner?: boolean;
}

/**
 * Provider component that manages all sync-related functionality
 */
export const SyncProvider: React.FC<SyncProviderProps> = ({
  children,
  showErrorToasts = true,
  showErrorBanner = true,
}) => {
  const { conflicts } = useSyncStore();
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Auto-open conflict modal when conflicts are detected
  React.useEffect(() => {
    if (conflicts.length > 0 && !isConflictModalOpen) {
      setIsConflictModalOpen(true);
    }
  }, [conflicts.length, isConflictModalOpen]);

  return (
    <>
      {children}
      
      {/* Auto-sync handler - manages background sync */}
      <AutoSyncHandler />
      
      {/* Error handling */}
      {showErrorBanner && <SyncErrorHandler />}
      {showErrorToasts && <SyncErrorToast />}
      
      {/* Conflict resolution modal */}
      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
      />
    </>
  );
};

/**
 * Hook to access sync provider functionality
 */
export const useSyncProvider = () => {
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const { conflicts, syncErrors } = useSyncStore();

  const openConflictModal = () => setIsConflictModalOpen(true);
  const closeConflictModal = () => setIsConflictModalOpen(false);

  return {
    // Conflict management
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
    isConflictModalOpen,
    openConflictModal,
    closeConflictModal,
    
    // Error management
    hasErrors: syncErrors.length > 0,
    errorCount: syncErrors.length,
    
    // Status
    needsAttention: conflicts.length > 0 || syncErrors.length > 0,
  };
};