import { api } from '../lib/api';
import type { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '@memo-app/shared/types';

export const categoryService = {
  // CRUD operations
  createCategory: async (category: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post<Category>('/categories', category);
    return response.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  updateCategory: async (id: string, updates: UpdateCategoryRequest): Promise<Category> => {
    const response = await api.put<Category>(`/categories/${id}`, updates);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  // Category statistics
  getCategoryStats: async (id: string): Promise<{ memoCount: number; reviewCount: number }> => {
    const response = await api.get<{ memoCount: number; reviewCount: number }>(`/categories/${id}/stats`);
    return response.data;
  },
};