import { api } from '../lib/api';
import type { 
  Memo, 
  CreateMemoRequest, 
  UpdateMemoRequest,
  PaginatedResponse,
  PaginationParams 
} from '@memo-app/shared/types';

export interface MemoSearchParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'nextReviewAt';
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown; // Index signature for compatibility
}

export const memoService = {
  // CRUD operations
  createMemo: async (memo: CreateMemoRequest): Promise<Memo> => {
    const response = await api.post<Memo>('/memos', memo);
    return response.data as Memo;
  },

  getMemos: async (params?: MemoSearchParams): Promise<PaginatedResponse<Memo>> => {
    const response = await api.get<PaginatedResponse<Memo>>('/memos', params);
    return response.data as PaginatedResponse<Memo>;
  },

  getMemo: async (id: string): Promise<Memo> => {
    const response = await api.get<Memo>(`/memos/${id}`);
    return response.data as Memo;
  },

  updateMemo: async (id: string, updates: UpdateMemoRequest): Promise<Memo> => {
    const response = await api.put<Memo>(`/memos/${id}`, updates);
    return response.data as Memo;
  },

  deleteMemo: async (id: string): Promise<void> => {
    await api.delete(`/memos/${id}`);
  },

  // Search and filtering
  searchMemos: async (query: string, params?: PaginationParams): Promise<PaginatedResponse<Memo>> => {
    const response = await api.get<PaginatedResponse<Memo>>('/memos/search', {
      q: query,
      ...params,
    });
    return response.data as PaginatedResponse<Memo>;
  },

  // Tag management
  getTagSuggestions: async (query?: string): Promise<string[]> => {
    const response = await api.get<string[]>('/tags/suggestions', { q: query });
    return response.data as string[];
  },

  // Bulk operations
  bulkUpdateMemos: async (updates: Array<{ id: string; updates: UpdateMemoRequest }>): Promise<Memo[]> => {
    const response = await api.put<Memo[]>('/memos/bulk', { updates });
    return response.data as Memo[];
  },

  bulkDeleteMemos: async (ids: string[]): Promise<void> => {
    await api.delete(`/memos/bulk?ids=${ids.join(',')}`);
  },

  // Review and spaced repetition
  getMemosForReview: async (): Promise<Memo[]> => {
    const response = await api.get<Memo[]>('/memos/review');
    return response.data as Memo[];
  },

  recordReview: async (memoId: string, performance: { remembered: boolean; confidence: number }): Promise<void> => {
    await api.post(`/memos/${memoId}/review`, performance);
  },
};