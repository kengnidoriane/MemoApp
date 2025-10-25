import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { memoService, type MemoSearchParams } from '../services/memoService';
import { useMemoStore } from '../stores/memoStore';
import type { 
  UpdateMemoRequest 
} from '@memo-app/shared/types';

// Query keys
export const memoKeys = {
  all: ['memos'] as const,
  lists: () => [...memoKeys.all, 'list'] as const,
  list: (params: MemoSearchParams) => [...memoKeys.lists(), params] as const,
  details: () => [...memoKeys.all, 'detail'] as const,
  detail: (id: string) => [...memoKeys.details(), id] as const,
  search: (query: string) => [...memoKeys.all, 'search', query] as const,
  tags: ['memos', 'tags'] as const,
  review: ['memos', 'review'] as const,
};

// Memo CRUD hooks
export const useMemos = (params?: MemoSearchParams) => {
  return useQuery({
    queryKey: memoKeys.list(params || {}),
    queryFn: () => memoService.getMemos(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useInfiniteMemos = (params?: MemoSearchParams) => {
  return useInfiniteQuery({
    queryKey: memoKeys.list(params || {}),
    queryFn: ({ pageParam = 1 }) => 
      memoService.getMemos({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMemo = (id: string) => {
  return useQuery({
    queryKey: memoKeys.detail(id),
    queryFn: () => memoService.getMemo(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateMemo = () => {
  const queryClient = useQueryClient();
  const addMemo = useMemoStore((state) => state.addMemo);

  return useMutation({
    mutationFn: memoService.createMemo,
    onSuccess: (newMemo) => {
      // Update store
      addMemo(newMemo);
      
      // Invalidate memo lists
      queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
      
      // Add to cache
      queryClient.setQueryData(memoKeys.detail(newMemo.id), newMemo);
    },
  });
};

export const useUpdateMemo = () => {
  const queryClient = useQueryClient();
  const updateMemo = useMemoStore((state) => state.updateMemo);

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateMemoRequest }) =>
      memoService.updateMemo(id, updates),
    onSuccess: (updatedMemo) => {
      // Update store
      updateMemo(updatedMemo.id, updatedMemo);
      
      // Update cache
      queryClient.setQueryData(memoKeys.detail(updatedMemo.id), updatedMemo);
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
    },
  });
};

export const useDeleteMemo = () => {
  const queryClient = useQueryClient();
  const removeMemo = useMemoStore((state) => state.removeMemo);

  return useMutation({
    mutationFn: memoService.deleteMemo,
    onSuccess: (_, deletedId) => {
      // Update store
      removeMemo(deletedId);
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: memoKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
    },
  });
};

// Search hooks
export const useSearchMemos = (query: string, params?: MemoSearchParams) => {
  return useQuery({
    queryKey: memoKeys.search(query),
    queryFn: () => memoService.searchMemos(query, params),
    enabled: query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useTagSuggestions = (query?: string) => {
  return useQuery({
    queryKey: [...memoKeys.tags, query],
    queryFn: () => memoService.getTagSuggestions(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Review hooks
export const useMemosForReview = () => {
  return useQuery({
    queryKey: memoKeys.review,
    queryFn: memoService.getMemosForReview,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useRecordReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memoId, performance }: { 
      memoId: string; 
      performance: { remembered: boolean; confidence: number } 
    }) => memoService.recordReview(memoId, performance),
    onSuccess: () => {
      // Invalidate review queries and memo lists
      queryClient.invalidateQueries({ queryKey: memoKeys.review });
      queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
    },
  });
};

// Bulk operations
export const useBulkUpdateMemos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoService.bulkUpdateMemos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
    },
  });
};

export const useBulkDeleteMemos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoService.bulkDeleteMemos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
    },
  });
};