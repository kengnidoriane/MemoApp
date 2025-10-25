import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import { useMemoStore } from '../stores/memoStore';
import type { 
  UpdateCategoryRequest 
} from '@memo-app/shared/types';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  stats: (id: string) => [...categoryKeys.detail(id), 'stats'] as const,
};

// Category CRUD hooks
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: categoryService.getCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.getCategory(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const addCategory = useMemoStore((state) => state.addCategory);

  return useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: (newCategory) => {
      // Update store
      addCategory(newCategory);
      
      // Update cache
      queryClient.setQueryData(categoryKeys.detail(newCategory.id), newCategory);
      
      // Invalidate category list
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const updateCategory = useMemoStore((state) => state.updateCategory);

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateCategoryRequest }) =>
      categoryService.updateCategory(id, updates),
    onSuccess: (updatedCategory) => {
      // Update store
      updateCategory(updatedCategory.id, updatedCategory);
      
      // Update cache
      queryClient.setQueryData(categoryKeys.detail(updatedCategory.id), updatedCategory);
      
      // Invalidate category list
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const removeCategory = useMemoStore((state) => state.removeCategory);

  return useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: (_, deletedId) => {
      // Update store
      removeCategory(deletedId);
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: categoryKeys.detail(deletedId) });
      
      // Invalidate category list
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      
      // Also invalidate memo lists as they might be affected
      queryClient.invalidateQueries({ queryKey: ['memos', 'list'] });
    },
  });
};

export const useCategoryStats = (id: string) => {
  return useQuery({
    queryKey: categoryKeys.stats(id),
    queryFn: () => categoryService.getCategoryStats(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};