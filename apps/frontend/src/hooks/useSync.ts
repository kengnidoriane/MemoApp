import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { syncService } from '../services/syncService';
import { useMemoStore } from '../stores/memoStore';
// import type { 
//   SyncRequest,
//   ConflictResolution,
//   BatchUpdateRequest,
//   OfflineChange 
// } from '@memo-app/shared/types';

// Query keys
export const syncKeys = {
  all: ['sync'] as const,
  status: () => [...syncKeys.all, 'status'] as const,
  conflicts: () => [...syncKeys.all, 'conflicts'] as const,
};

// Sync hooks
export const useSyncData = () => {
  const queryClient = useQueryClient();
  const { setSyncStatus, setLastSyncAt } = useMemoStore();

  return useMutation({
    mutationFn: syncService.syncData,
    onMutate: () => {
      setSyncStatus('syncing');
    },
    onSuccess: (result) => {
      setSyncStatus('idle');
      setLastSyncAt(result.lastSyncTimestamp);
      
      // Invalidate all data queries to reflect synced changes
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      // Update conflicts if any
      if (result.conflicts.length > 0) {
        queryClient.setQueryData(syncKeys.conflicts(), result.conflicts);
      }
    },
    onError: () => {
      setSyncStatus('error');
    },
  });
};

export const useSyncStatus = () => {
  return useQuery({
    queryKey: syncKeys.status(),
    queryFn: syncService.getSyncStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useForceSync = () => {
  const queryClient = useQueryClient();
  const { setSyncStatus, setLastSyncAt } = useMemoStore();

  return useMutation({
    mutationFn: syncService.forceSync,
    onMutate: () => {
      setSyncStatus('syncing');
    },
    onSuccess: (result) => {
      setSyncStatus('idle');
      setLastSyncAt(result.lastSyncTimestamp);
      
      // Clear all cached data and refetch
      queryClient.clear();
    },
    onError: () => {
      setSyncStatus('error');
    },
  });
};

// Conflict resolution
export const useConflicts = () => {
  return useQuery({
    queryKey: syncKeys.conflicts(),
    queryFn: syncService.getConflicts,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useResolveConflicts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncService.resolveConflicts,
    onSuccess: () => {
      // Clear conflicts and refresh data
      queryClient.removeQueries({ queryKey: syncKeys.conflicts() });
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// Batch operations for offline changes
export const useBatchUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncService.batchUpdate,
    onSuccess: (result) => {
      // Handle conflicts if any
      if (result.conflicts.length > 0) {
        queryClient.setQueryData(syncKeys.conflicts(), result.conflicts);
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// Specific entity sync
export const useSyncMemos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncService.syncMemos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
    },
  });
};

export const useSyncCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncService.syncCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};