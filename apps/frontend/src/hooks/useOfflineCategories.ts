import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offlineCategoryService } from '../services/offlineCategoryService';
import { useMemoStore } from '../stores/memoStore';
import { useOffline } from './useOffline';
import type { 
  Category,
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '@memo-app/shared/types';

// Query keys for offline operations
export const offlineCategoryKeys = {
  all: ['offline-categories'] as const,
  lists: () => [...offlineCategoryKeys.all, 'list'] as const,
  details: () => [...offlineCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...offlineCategoryKeys.details(), id] as const,
  syncStatus: ['offline-categories', 'sync-status'] as const,
};

// Offline-aware category hooks
export const useOfflineCategories = () => {
  const { isOnline } = useOffline();
  
  return useQuery({
    queryKey: offlineCategoryKeys.lists(),
    queryFn: () => offlineCategoryService.getCategories(),
    staleTime: isOnline ? 30 * 1000 : Infinity, // 30 seconds when online, never stale when offline
    refetchOnWindowFocus: isOnline,
    refetchOnReconnect: true,
  });
};

export const useOfflineCategory = (id: string) => {
  return useQuery({
    queryKey: offlineCategoryKeys.detail(id),
    queryFn: () => offlineCategoryService.getCategory(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateOfflineCategory = () => {
  const queryClient = useQueryClient();
  const addCategory = useMemoStore((state) => state.addCategory);

  return useMutation({
    mutationFn: async (categoryData: CreateCategoryRequest) => {
      const category = await offlineCategoryService.createCategory(categoryData);
      return category;
    },
    onSuccess: (newCategory) => {
      // Update store immediately for optimistic UI
      addCategory(newCategory);
      
      // Update cache
      queryClient.setQueryData(offlineCategoryKeys.detail(newCategory.id), newCategory);
      
      // Invalidate lists to show new category
      queryClient.invalidateQueries({ queryKey: offlineCategoryKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to create category:', error);
    },
  });
};

export const useUpdateOfflineCategory = () => {
  const queryClient = useQueryClient();
  const updateCategory = useMemoStore((state) => state.updateCategory);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCategoryRequest }) => {
      const category = await offlineCategoryService.updateCategory(id, updates);
      return category;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: offlineCategoryKeys.detail(id) });
      
      // Snapshot previous value
      const previousCategory = queryClient.getQueryData(offlineCategoryKeys.detail(id));
      
      // Optimistically update cache
      queryClient.setQueryData(offlineCategoryKeys.detail(id), (old: Category | undefined) => 
        old ? { ...old, ...updates } : undefined
      );
      
      return { previousCategory };
    },
    onSuccess: (updatedCategory) => {
      // Update store
      updateCategory(updatedCategory.id, updatedCategory);
      
      // Update cache with server response
      queryClient.setQueryData(offlineCategoryKeys.detail(updatedCategory.id), updatedCategory);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: offlineCategoryKeys.lists() });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousCategory) {
        queryClient.setQueryData(offlineCategoryKeys.detail(variables.id), context.previousCategory);
      }
      console.error('Failed to update category:', error);
    },
  });
};

export const useDeleteOfflineCategory = () => {
  const queryClient = useQueryClient();
  const removeCategory = useMemoStore((state) => state.removeCategory);

  return useMutation({
    mutationFn: async (id: string) => {
      await offlineCategoryService.deleteCategory(id);
      return id;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: offlineCategoryKeys.detail(id) });
      
      // Snapshot previous value
      const previousCategory = queryClient.getQueryData(offlineCategoryKeys.detail(id));
      
      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: offlineCategoryKeys.detail(id) });
      
      return { previousCategory };
    },
    onSuccess: (deletedId) => {
      // Update store
      removeCategory(deletedId);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: offlineCategoryKeys.lists() });
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousCategory) {
        queryClient.setQueryData(offlineCategoryKeys.detail(id), context.previousCategory);
      }
      console.error('Failed to delete category:', error);
    },
  });
};

// Sync status hooks
export const useCategorySyncStatus = () => {
  return useQuery({
    queryKey: offlineCategoryKeys.syncStatus,
    queryFn: () => offlineCategoryService.getSyncStatus(),
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
    staleTime: 1 * 1000, // 1 second
  });
};

// Force sync hook
export const useForceOfflineCategorySync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await offlineCategoryService.forceSync();
    },
    onSuccess: () => {
      // Invalidate all category queries to reflect synced data
      queryClient.invalidateQueries({ queryKey: offlineCategoryKeys.all });
    },
    onError: (error) => {
      console.error('Force category sync failed:', error);
    },
  });
};