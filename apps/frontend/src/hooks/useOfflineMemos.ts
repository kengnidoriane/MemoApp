import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offlineMemoService } from '../services/offlineMemoService';
import { useMemoStore } from '../stores/memoStore';
import { useOffline } from './useOffline';
import { offlineQueueManager } from '../lib/offlineQueueManager';
import type { 
  Memo,
  CreateMemoRequest, 
  UpdateMemoRequest 
} from '@memo-app/shared/types';

// Query keys for offline operations
export const offlineMemoKeys = {
  all: ['offline-memos'] as const,
  lists: () => [...offlineMemoKeys.all, 'list'] as const,
  details: () => [...offlineMemoKeys.all, 'detail'] as const,
  detail: (id: string) => [...offlineMemoKeys.details(), id] as const,
  search: (query: string) => [...offlineMemoKeys.all, 'search', query] as const,
  syncStatus: ['offline-memos', 'sync-status'] as const,
};

// Offline-aware memo hooks
export const useOfflineMemos = () => {
  const { isOnline } = useOffline();
  
  return useQuery({
    queryKey: offlineMemoKeys.lists(),
    queryFn: () => offlineMemoService.getMemos(),
    staleTime: isOnline ? 30 * 1000 : Infinity, // 30 seconds when online, never stale when offline
    refetchOnWindowFocus: isOnline,
    refetchOnReconnect: true,
  });
};

export const useOfflineMemo = (id: string) => {
  return useQuery({
    queryKey: offlineMemoKeys.detail(id),
    queryFn: () => offlineMemoService.getMemo(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateOfflineMemo = () => {
  const queryClient = useQueryClient();
  const addMemo = useMemoStore((state) => state.addMemo);

  return useMutation({
    mutationFn: async (memoData: CreateMemoRequest) => {
      const memo = await offlineMemoService.createMemo(memoData);
      return memo;
    },
    onSuccess: (newMemo) => {
      // Update store immediately for optimistic UI
      addMemo(newMemo);
      
      // Update cache
      queryClient.setQueryData(offlineMemoKeys.detail(newMemo.id), newMemo);
      
      // Invalidate lists to show new memo
      queryClient.invalidateQueries({ queryKey: offlineMemoKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to create memo:', error);
    },
  });
};

export const useUpdateOfflineMemo = () => {
  const queryClient = useQueryClient();
  const updateMemo = useMemoStore((state) => state.updateMemo);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateMemoRequest }) => {
      const memo = await offlineMemoService.updateMemo(id, updates);
      return memo;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: offlineMemoKeys.detail(id) });
      
      // Snapshot previous value
      const previousMemo = queryClient.getQueryData(offlineMemoKeys.detail(id));
      
      // Optimistically update cache
      queryClient.setQueryData(offlineMemoKeys.detail(id), (old: Memo | undefined) => 
        old ? { ...old, ...updates } : undefined
      );
      
      return { previousMemo };
    },
    onSuccess: (updatedMemo) => {
      // Update store
      updateMemo(updatedMemo.id, updatedMemo);
      
      // Update cache with server response
      queryClient.setQueryData(offlineMemoKeys.detail(updatedMemo.id), updatedMemo);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: offlineMemoKeys.lists() });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousMemo) {
        queryClient.setQueryData(offlineMemoKeys.detail(variables.id), context.previousMemo);
      }
      console.error('Failed to update memo:', error);
    },
  });
};

export const useDeleteOfflineMemo = () => {
  const queryClient = useQueryClient();
  const removeMemo = useMemoStore((state) => state.removeMemo);

  return useMutation({
    mutationFn: async (id: string) => {
      await offlineMemoService.deleteMemo(id);
      return id;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: offlineMemoKeys.detail(id) });
      
      // Snapshot previous value
      const previousMemo = queryClient.getQueryData(offlineMemoKeys.detail(id));
      
      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: offlineMemoKeys.detail(id) });
      
      return { previousMemo };
    },
    onSuccess: (deletedId) => {
      // Update store
      removeMemo(deletedId);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: offlineMemoKeys.lists() });
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousMemo) {
        queryClient.setQueryData(offlineMemoKeys.detail(id), context.previousMemo);
      }
      console.error('Failed to delete memo:', error);
    },
  });
};

// Search hooks
export const useSearchOfflineMemos = (query: string) => {
  return useQuery({
    queryKey: offlineMemoKeys.search(query),
    queryFn: () => offlineMemoService.searchMemos(query),
    enabled: query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useOfflineMemosByCategory = (categoryId: string) => {
  return useQuery({
    queryKey: [...offlineMemoKeys.lists(), 'category', categoryId],
    queryFn: () => offlineMemoService.getMemosByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 30 * 1000,
  });
};

// Sync status hooks
export const useMemoSyncStatus = () => {
  return useQuery({
    queryKey: offlineMemoKeys.syncStatus,
    queryFn: () => offlineMemoService.getSyncStatus(),
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
    staleTime: 1 * 1000, // 1 second
  });
};

export const useOfflineQueueStatus = () => {
  return useQuery({
    queryKey: ['offline-queue', 'status'],
    queryFn: () => offlineQueueManager.getQueueStatus(),
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
    staleTime: 1 * 1000, // 1 second
  });
};

export const useProcessOfflineQueue = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useOffline();

  return useMutation({
    mutationFn: () => offlineQueueManager.processQueue(),
    onSuccess: (result) => {
      console.log('Queue processed:', result);
      
      // Invalidate all memo queries to reflect synced changes
      queryClient.invalidateQueries({ queryKey: offlineMemoKeys.all });
      queryClient.invalidateQueries({ queryKey: ['offline-queue'] });
    },
    onError: (error) => {
      console.error('Failed to process offline queue:', error);
    },
    // Only allow when online
    mutationKey: ['process-offline-queue'],
    retry: isOnline ? 3 : 0,
  });
};

// Force sync hook
export const useForceOfflineSync = () => {
  const queryClient = useQueryClient();
  const processQueue = useProcessOfflineQueue();

  return useMutation({
    mutationFn: async () => {
      // Process offline queue first
      const result = await offlineQueueManager.processQueue();
      
      // Then force sync
      await offlineMemoService.forceSync();
      
      return result;
    },
    onSuccess: () => {
      // Invalidate all queries to reflect synced data
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Force sync failed:', error);
    },
  });
};