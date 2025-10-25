import { api } from '../lib/api';
import type { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '@memo-app/shared/types';

export const categoryService = {
  // CRUD operations
  createCategory: async (category: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post<{ data: Category }>('/categories', category);
    return response.data?.data || { id: '', name: '', color: '', userId: '', memoCount: 0, createdAt: new Date(), updatedAt: new Date(), syncVersion: 0, isDeleted: false };
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<{ data: Category[] }>('/categories');
    return response.data?.data || [];
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await api.get<{ data: Category }>(`/categories/${id}`);
    return response.data?.data || { id: '', name: '', color: '', userId: '', memoCount: 0, createdAt: new Date(), updatedAt: new Date(), syncVersion: 0, isDeleted: false };
  },

  updateCategory: async (id: string, updates: UpdateCategoryRequest): Promise<Category> => {
    const response = await api.put<{ data: Category }>(`/categories/${id}`, updates);
    return response.data?.data || { id: '', name: '', color: '', userId: '', memoCount: 0, createdAt: new Date(), updatedAt: new Date(), syncVersion: 0, isDeleted: false };
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  // Category statistics
  getCategoryStats: async (id: string): Promise<{ memoCount: number; reviewCount: number }> => {
    const response = await api.get<{ data: { memoCount: number; reviewCount: number } }>(`/categories/${id}/stats`);
    return response.data?.data || { memoCount: 0, reviewCount: 0 };
  },
};