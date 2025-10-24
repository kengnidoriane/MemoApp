import { create } from 'zustand';
import type { Memo, Category } from '@memo-app/shared/types';

interface MemoFilters {
  search: string;
  categoryId?: string;
  tags: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface MemoState {
  memos: Memo[];
  categories: Category[];
  selectedMemo: Memo | null;
  filters: MemoFilters;
  isLoading: boolean;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncAt: Date | null;
}

interface MemoActions {
  setMemos: (memos: Memo[]) => void;
  addMemo: (memo: Memo) => void;
  updateMemo: (id: string, updates: Partial<Memo>) => void;
  removeMemo: (id: string) => void;
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  setSelectedMemo: (memo: Memo | null) => void;
  setFilters: (filters: Partial<MemoFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  setLastSyncAt: (date: Date) => void;
}

type MemoStore = MemoState & MemoActions;

const initialFilters: MemoFilters = {
  search: '',
  tags: [],
};

const initialState: MemoState = {
  memos: [],
  categories: [],
  selectedMemo: null,
  filters: initialFilters,
  isLoading: false,
  error: null,
  syncStatus: 'idle',
  lastSyncAt: null,
};

export const useMemoStore = create<MemoStore>((set, get) => ({
  ...initialState,
  
  setMemos: (memos) => {
    set({ memos });
  },
  
  addMemo: (memo) => {
    const { memos } = get();
    set({ memos: [memo, ...memos] });
  },
  
  updateMemo: (id, updates) => {
    const { memos } = get();
    set({
      memos: memos.map((memo) =>
        memo.id === id ? { ...memo, ...updates } : memo
      ),
    });
  },
  
  removeMemo: (id) => {
    const { memos } = get();
    set({
      memos: memos.filter((memo) => memo.id !== id),
      selectedMemo: get().selectedMemo?.id === id ? null : get().selectedMemo,
    });
  },
  
  setCategories: (categories) => {
    set({ categories });
  },
  
  addCategory: (category) => {
    const { categories } = get();
    set({ categories: [...categories, category] });
  },
  
  updateCategory: (id, updates) => {
    const { categories } = get();
    set({
      categories: categories.map((category) =>
        category.id === id ? { ...category, ...updates } : category
      ),
    });
  },
  
  removeCategory: (id) => {
    const { categories } = get();
    set({
      categories: categories.filter((category) => category.id !== id),
    });
  },
  
  setSelectedMemo: (memo) => {
    set({ selectedMemo: memo });
  },
  
  setFilters: (filterUpdates) => {
    const { filters } = get();
    set({
      filters: { ...filters, ...filterUpdates },
    });
  },
  
  clearFilters: () => {
    set({ filters: initialFilters });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  setSyncStatus: (status) => {
    set({ syncStatus: status });
  },
  
  setLastSyncAt: (date) => {
    set({ lastSyncAt: date });
  },
}));